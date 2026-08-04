import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


args = sys.argv[sys.argv.index("--") + 1 :]
input_blend = Path(args[0]).resolve()
output_blend = Path(args[1]).resolve()
preview_dir = Path(args[2]).resolve()

MOUTH_CENTER = Vector((0.0, -0.158, 1.414))
MOUTH_RX = 0.080
MOUTH_RZ = 0.052
FRONT_Y_LIMIT = -0.105
VISEMES = ("viseme_sil", "viseme_aa", "viseme_I", "viseme_U", "viseme_E", "viseme_O")


def smoothstep01(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def mouth_weight(point):
    nx = point.x / MOUTH_RX
    nz = (point.z - MOUTH_CENTER.z) / MOUTH_RZ
    radius = math.sqrt(nx * nx + nz * nz)
    if radius >= 1.0 or point.y > FRONT_Y_LIMIT:
        return 0.0, nx, nz
    radial = smoothstep01(1.0 - radius)
    depth = smoothstep01((-point.y - 0.10) / 0.06)
    return radial * depth, nx, nz


def eye_weight(point, center_x):
    nx = (point.x - center_x) / 0.050
    nz = (point.z - 1.515) / 0.036
    radius = math.sqrt(nx * nx + nz * nz)
    if radius >= 1.0 or point.y > -0.105:
        return 0.0, nx, nz
    return smoothstep01(1.0 - radius), nx, nz


def set_key_from_world(mesh, key_name, transform):
    basis = mesh.data.shape_keys.key_blocks["Basis"]
    key = mesh.data.shape_keys.key_blocks[key_name]
    inverse = mesh.matrix_world.inverted()
    changed = 0
    for index, basis_point in enumerate(basis.data):
        world = mesh.matrix_world @ basis_point.co
        updated = transform(world.copy())
        key.data[index].co = inverse @ updated
        if (updated - world).length > 1e-7:
            changed += 1
    key.value = 0.0
    key.slider_min = 0.0
    key.slider_max = 1.0
    print("KEY_UPDATED", key_name, changed)


def deform_mouth(shape_name):
    def transform(point):
        weight, nx, nz = mouth_weight(point)
        if weight <= 0.0:
            return point

        upper = smoothstep01(max(0.0, nz))
        lower = smoothstep01(max(0.0, -nz))
        center_band = smoothstep01(1.0 - min(1.0, abs(nz)))
        side = smoothstep01(min(1.0, abs(nx)))

        if shape_name == "viseme_aa":
            point.z += weight * (0.006 * upper - 0.017 * lower)
            point.x -= weight * point.x * 0.05
            point.y += weight * 0.003 * center_band
        elif shape_name == "viseme_I":
            point.x += weight * math.copysign(0.010, point.x or 1.0) * side
            point.z += weight * (0.0035 * upper - 0.006 * lower)
            point.y -= weight * 0.002
        elif shape_name == "viseme_U":
            point.x -= weight * point.x * 0.24
            point.z += weight * (0.004 * upper - 0.005 * lower)
            point.y -= weight * 0.010 * center_band
        elif shape_name == "viseme_E":
            point.x += weight * math.copysign(0.008, point.x or 1.0) * side
            point.z += weight * (0.004 * upper - 0.009 * lower)
            point.y -= weight * 0.002
        elif shape_name == "viseme_O":
            point.x -= weight * point.x * 0.20
            point.z += weight * (0.008 * upper - 0.012 * lower)
            point.y -= weight * 0.008 * center_band
        elif shape_name == "mouthSmile":
            corner = smoothstep01((abs(nx) - 0.25) / 0.65)
            point.x += weight * math.copysign(0.010, point.x or 1.0) * corner
            point.z += weight * (0.011 * corner - 0.002 * center_band)
            point.y -= weight * 0.002
        return point

    return transform


def deform_blink(center_x):
    def transform(point):
        weight, _nx, nz = eye_weight(point, center_x)
        if weight <= 0.0:
            return point
        point.z -= weight * nz * 0.028
        point.y += weight * 0.002
        return point

    return transform


def rebuild_guide_group(mesh, name, selector):
    old = mesh.vertex_groups.get(name)
    if old:
        mesh.vertex_groups.remove(old)
    group = mesh.vertex_groups.new(name=name)
    count = 0
    for vertex in mesh.data.vertices:
        world = mesh.matrix_world @ vertex.co
        weight = selector(world)
        if weight > 0.0:
            group.add([vertex.index], weight, "REPLACE")
            count += 1
    print("GUIDE_UPDATED", name, count)


def create_material(name, color, roughness=0.5):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if "IOR Level" in bsdf.inputs:
        bsdf.inputs["IOR Level"].default_value = 0.0
    return material


def create_unlit_material(name, color):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (*color, 1.0)
    emission.inputs["Strength"].default_value = 1.0
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def mouth_surface_y(x, z):
    x_ratio = min(1.0, abs(x) / 0.055)
    z_ratio = (z - MOUTH_CENTER.z) / 0.030
    return -0.169 + 0.026 * x_ratio * x_ratio + 0.004 * z_ratio


def create_oval_morph_object(name, material, shape_specs, ring_count=48):
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

    center = Vector((MOUTH_CENTER.x, mouth_surface_y(0.0, MOUTH_CENTER.z) - 0.0015, MOUTH_CENTER.z))
    vertices = [tuple(center)]
    for index in range(ring_count):
        angle = 2.0 * math.pi * index / ring_count
        vertices.append((center.x, center.y, center.z))

    faces = []
    for index in range(ring_count):
        faces.append((0, index + 1, ((index + 1) % ring_count) + 1))

    data = bpy.data.meshes.new(name + "Data")
    data.from_pydata(vertices, [], faces)
    data.materials.append(material)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)

    basis = obj.shape_key_add(name="Basis", from_mix=False)
    for shape_name in (
        "viseme_sil",
        "viseme_aa",
        "viseme_I",
        "viseme_U",
        "viseme_E",
        "viseme_O",
        "mouthSmile",
        "eyeBlinkLeft",
        "eyeBlinkRight",
    ):
        key = obj.shape_key_add(name=shape_name, from_mix=False)
        spec = shape_specs.get(shape_name)
        if spec is None:
            continue
        radius_x, radius_z, z_offset = spec
        key.data[0].co = center + Vector((0.0, -0.0005, z_offset))
        for index in range(ring_count):
            angle = 2.0 * math.pi * index / ring_count
            x = center.x + radius_x * math.cos(angle)
            z = center.z + z_offset + radius_z * math.sin(angle)
            y = mouth_surface_y(x, z) - 0.0020
            key.data[index + 1].co = (x, y, z)
        key.value = 0.0
    return obj


def create_lip_ring_morph_object(name, material, shape_specs, ring_count=48):
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

    center = Vector((MOUTH_CENTER.x, mouth_surface_y(0.0, MOUTH_CENTER.z) - 0.0038, MOUTH_CENTER.z))
    vertices = [tuple(center)] * (ring_count * 2)
    faces = []
    for index in range(ring_count):
        next_index = (index + 1) % ring_count
        faces.append((index, next_index, ring_count + next_index, ring_count + index))

    data = bpy.data.meshes.new(name + "Data")
    data.from_pydata(vertices, [], faces)
    data.materials.append(material)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.shape_key_add(name="Basis", from_mix=False)

    for shape_name in (
        "viseme_sil",
        "viseme_aa",
        "viseme_I",
        "viseme_U",
        "viseme_E",
        "viseme_O",
        "mouthSmile",
        "eyeBlinkLeft",
        "eyeBlinkRight",
    ):
        key = obj.shape_key_add(name=shape_name, from_mix=False)
        spec = shape_specs.get(shape_name)
        if spec is None:
            continue
        inner_x, inner_z, z_offset = spec
        outer_x = inner_x + 0.0042
        outer_z = inner_z + 0.0030
        for index in range(ring_count):
            angle = 2.0 * math.pi * index / ring_count
            for ring_offset, radius_x, radius_z, depth in (
                (0, outer_x, outer_z, -0.0026),
                (ring_count, inner_x, inner_z, -0.0044),
            ):
                x = center.x + radius_x * math.cos(angle)
                z = center.z + z_offset + radius_z * math.sin(angle)
                y = mouth_surface_y(x, z) + depth
                key.data[index + ring_offset].co = (x, y, z)
        key.value = 0.0
    for polygon in data.polygons:
        polygon.use_smooth = True
    return obj


def create_teeth_morph_object(name, material, shape_specs):
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)

    center = Vector((MOUTH_CENTER.x, mouth_surface_y(0.0, MOUTH_CENTER.z) - 0.0030, MOUTH_CENTER.z))
    vertices = [tuple(center)] * 7
    data = bpy.data.meshes.new(name + "Data")
    data.from_pydata(vertices, [], [tuple(range(7))])
    data.materials.append(material)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.shape_key_add(name="Basis", from_mix=False)

    for shape_name in (
        "viseme_sil",
        "viseme_aa",
        "viseme_I",
        "viseme_U",
        "viseme_E",
        "viseme_O",
        "mouthSmile",
        "eyeBlinkLeft",
        "eyeBlinkRight",
    ):
        key = obj.shape_key_add(name=shape_name, from_mix=False)
        spec = shape_specs.get(shape_name)
        if spec is None:
            continue
        radius_x, height, z_offset = spec
        top = center.z + z_offset + height * 0.55
        bottom = center.z + z_offset - height * 0.45
        points = (
            (-radius_x, top - height * 0.20),
            (-radius_x * 0.55, top),
            (radius_x * 0.55, top),
            (radius_x, top - height * 0.20),
            (radius_x * 0.72, bottom + height * 0.08),
            (0.0, bottom),
            (-radius_x * 0.72, bottom + height * 0.08),
        )
        for index, (x, z) in enumerate(points):
            y = mouth_surface_y(x, z) - 0.0032
            key.data[index].co = (x, y, z)
        key.value = 0.0
    return obj


def link_shape_drivers(master, followers):
    master_keys = master.data.shape_keys
    for follower in followers:
        follower_keys = follower.data.shape_keys
        for key in follower_keys.key_blocks:
            if key.name == "Basis" or master_keys.key_blocks.get(key.name) is None:
                continue
            curve = key.driver_add("value")
            driver = curve.driver
            driver.type = "SCRIPTED"
            driver.expression = "master_value"
            variable = driver.variables.new()
            variable.name = "master_value"
            variable.type = "SINGLE_PROP"
            variable.targets[0].id_type = "KEY"
            variable.targets[0].id = master_keys
            variable.targets[0].data_path = f'key_blocks["{key.name}"].value'


def set_all_shape_values(value_name=None):
    master = bpy.data.objects["Bomi_Teacher_Mesh"]
    for key in master.data.shape_keys.key_blocks:
        key.value = 1.0 if key.name == value_name else 0.0
    bpy.context.view_layer.update()


def add_render_camera_and_lights():
    for obj in list(bpy.data.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(obj, do_unlink=True)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.035, 0.04, 0.055)

    camera_data = bpy.data.cameras.new("BomiFaceCamera")
    camera = bpy.data.objects.new("BomiFaceCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    camera.location = (0.0, -3.0, 1.535)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 0.58
    camera.rotation_euler = (
        Vector((0.0, 0.0, 1.535)) - camera.location
    ).to_track_quat("-Z", "Y").to_euler()

    for name, location, energy, size in (
        ("BomiKey", (-1.6, -2.0, 2.7), 1000, 3.0),
        ("BomiFill", (1.7, -1.5, 2.0), 700, 2.5),
        ("BomiRim", (0.0, 1.4, 2.4), 850, 2.0),
    ):
        light_data = bpy.data.lights.new(name=name, type="AREA")
        light_data.energy = energy
        light_data.shape = "DISK"
        light_data.size = size
        light = bpy.data.objects.new(name, light_data)
        bpy.context.collection.objects.link(light)
        light.location = location
        light.rotation_euler = (
            Vector((0.0, 0.0, 1.45)) - light.location
        ).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(input_blend))
    mesh = bpy.data.objects["Bomi_Teacher_Mesh"]
    keys = mesh.data.shape_keys.key_blocks

    set_key_from_world(mesh, "viseme_sil", lambda point: point)
    for shape_name in ("viseme_aa", "viseme_I", "viseme_U", "viseme_E", "viseme_O", "mouthSmile"):
        set_key_from_world(mesh, shape_name, deform_mouth(shape_name))
    set_key_from_world(mesh, "eyeBlinkLeft", deform_blink(0.068))
    set_key_from_world(mesh, "eyeBlinkRight", deform_blink(-0.068))

    rebuild_guide_group(
        mesh,
        "FACE_RIG_GUIDE_MOUTH",
        lambda point: mouth_weight(point)[0],
    )
    rebuild_guide_group(
        mesh,
        "FACE_RIG_GUIDE_EYE_L",
        lambda point: eye_weight(point, 0.068)[0],
    )
    rebuild_guide_group(
        mesh,
        "FACE_RIG_GUIDE_EYE_R",
        lambda point: eye_weight(point, -0.068)[0],
    )

    mouth_specs = {
        "viseme_aa": (0.029, 0.013, -0.002),
        "viseme_I": (0.032, 0.0055, 0.000),
        "viseme_U": (0.011, 0.008, -0.001),
        "viseme_E": (0.032, 0.008, 0.000),
        "viseme_O": (0.012, 0.014, -0.002),
        "mouthSmile": (0.033, 0.0055, 0.003),
    }
    mouth_material = create_unlit_material("Bomi_Mouth_Interior_Mat", (0.004, 0.00008, 0.00014))
    mouth_interior = create_oval_morph_object(
        "Bomi_Mouth_Interior",
        mouth_material,
        mouth_specs,
    )
    lip_material = create_material("Bomi_Lips_Mat", (0.28, 0.055, 0.045), 0.72)
    lip_ring = create_lip_ring_morph_object(
        "Bomi_Lip_Ring",
        lip_material,
        mouth_specs,
    )
    teeth_material = create_material("Bomi_Teeth_Mat", (0.52, 0.47, 0.40), 0.58)
    upper_teeth = create_teeth_morph_object(
        "Bomi_Upper_Teeth",
        teeth_material,
        {
            "viseme_aa": (0.017, 0.0032, 0.0045),
            "viseme_I": (0.022, 0.0028, 0.0015),
            "viseme_E": (0.022, 0.0030, 0.0025),
        },
    )
    link_shape_drivers(mesh, (mouth_interior, lip_ring, upper_teeth))

    mesh["malhaebom_face_rig_status"] = "PROCEDURAL_V1: Visemes sculpted; visual tuning recommended"
    mesh["malhaebom_mouth_center_world"] = tuple(MOUTH_CENTER)
    bpy.context.scene["malhaebom_notes"] = (
        "Procedural facial rig v1 with A/I/U/E/O, smile and blink keys."
    )

    add_render_camera_and_lights()
    preview_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    for shape_name in (None, "viseme_aa", "viseme_I", "viseme_U", "viseme_E", "viseme_O", "mouthSmile"):
        set_all_shape_values(shape_name)
        label = "neutral" if shape_name is None else shape_name
        scene.render.filepath = str(preview_dir / f"{label}.png")
        bpy.ops.render.render(write_still=True)
        print("PREVIEW_RENDERED", label)

    set_all_shape_values(None)
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    output_blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output_blend))
    print("BOMI_VISEMES_CREATED", output_blend)


main()
