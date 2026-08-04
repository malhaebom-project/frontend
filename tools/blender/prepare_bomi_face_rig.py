"""Prepare the Meshy Bomi model for manual facial Shape Key sculpting.

Run with Blender:
  blender --background --factory-startup --python prepare_bomi_face_rig.py -- \
    <input.glb> <output.blend>

The generated Shape Keys are intentionally neutral placeholders. They must be
sculpted and visually reviewed before export.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


SHAPE_KEY_NAMES = (
    "viseme_sil",
    "viseme_aa",
    "viseme_I",
    "viseme_U",
    "viseme_E",
    "viseme_O",
    "mouthSmile",
    "eyeBlinkLeft",
    "eyeBlinkRight",
)


def task_args() -> tuple[Path, Path]:
    if "--" not in sys.argv:
        raise SystemExit("Expected: -- <input.glb> <output.blend>")
    args = sys.argv[sys.argv.index("--") + 1 :]
    if len(args) != 2:
        raise SystemExit("Expected exactly two task arguments")
    return Path(args[0]).resolve(), Path(args[1]).resolve()


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def mesh_score(obj: bpy.types.Object) -> int:
    if obj.type != "MESH":
        return -1
    return len(obj.data.vertices)


def ellipse_weight(
    coordinate: Vector,
    *,
    center_x: float,
    center_z: float,
    radius_x: float,
    radius_z: float,
    front_limit: float,
) -> float:
    if coordinate.y > front_limit:
        return 0.0
    distance = math.sqrt(
        ((coordinate.x - center_x) / radius_x) ** 2
        + ((coordinate.z - center_z) / radius_z) ** 2
    )
    return max(0.0, 1.0 - distance)


def create_guide_group(
    obj: bpy.types.Object,
    name: str,
    *,
    center_x: float,
    center_z: float,
    radius_x: float,
    radius_z: float,
    front_limit: float,
) -> int:
    old = obj.vertex_groups.get(name)
    if old:
        obj.vertex_groups.remove(old)
    group = obj.vertex_groups.new(name=name)
    selected = 0
    for vertex in obj.data.vertices:
        world = obj.matrix_world @ vertex.co
        weight = ellipse_weight(
            world,
            center_x=center_x,
            center_z=center_z,
            radius_x=radius_x,
            radius_z=radius_z,
            front_limit=front_limit,
        )
        if weight > 0.0:
            group.add([vertex.index], weight, "REPLACE")
            selected += 1
    return selected


def prepare() -> None:
    input_path, output_path = task_args()
    if not input_path.exists():
        raise SystemExit(f"Input GLB not found: {input_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=str(input_path))

    mesh = max(bpy.context.scene.objects, key=mesh_score)
    if mesh.type != "MESH":
        raise RuntimeError("No mesh object was imported")
    armature = next(
        (obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"),
        None,
    )

    mesh.name = "Bomi_Teacher_Mesh"
    mesh.data.name = "Bomi_Teacher_MeshData"
    if armature:
        armature.name = "Bomi_Teacher_Rig"
        armature.data.name = "Bomi_Teacher_RigData"

    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)

    if mesh.data.shape_keys is None:
        mesh.shape_key_add(name="Basis", from_mix=False)
    existing = mesh.data.shape_keys.key_blocks
    for name in SHAPE_KEY_NAMES:
        if existing.get(name) is None:
            key = mesh.shape_key_add(name=name, from_mix=False)
            key.slider_min = 0.0
            key.slider_max = 1.0
            key.value = 0.0

    guide_counts = {
        "FACE_RIG_GUIDE_MOUTH": create_guide_group(
            mesh,
            "FACE_RIG_GUIDE_MOUTH",
            center_x=0.0,
            center_z=1.50,
            radius_x=0.105,
            radius_z=0.065,
            front_limit=-0.105,
        ),
        "FACE_RIG_GUIDE_EYE_L": create_guide_group(
            mesh,
            "FACE_RIG_GUIDE_EYE_L",
            center_x=0.065,
            center_z=1.575,
            radius_x=0.055,
            radius_z=0.042,
            front_limit=-0.105,
        ),
        "FACE_RIG_GUIDE_EYE_R": create_guide_group(
            mesh,
            "FACE_RIG_GUIDE_EYE_R",
            center_x=-0.065,
            center_z=1.575,
            radius_x=0.055,
            radius_z=0.042,
            front_limit=-0.105,
        ),
    }

    mesh["malhaebom_face_rig_status"] = (
        "GUIDE_ONLY: Shape Keys contain no deformation until sculpted"
    )
    mesh["malhaebom_shape_key_set"] = ",".join(SHAPE_KEY_NAMES)
    mesh["malhaebom_guide_vertex_counts"] = str(guide_counts)
    mesh["malhaebom_source_glb"] = str(input_path)

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["malhaebom_notes"] = (
        "Sculpt A/I/U/E/O, smile and blink keys; do not export placeholders."
    )

    bpy.ops.wm.save_as_mainfile(filepath=str(output_path))
    print(
        "MALHAEBOM_FACE_RIG_PREPARED",
        {
            "mesh": mesh.name,
            "vertices": len(mesh.data.vertices),
            "shape_keys": list(mesh.data.shape_keys.key_blocks.keys()),
            "guide_counts": guide_counts,
            "output": str(output_path),
        },
    )


prepare()
