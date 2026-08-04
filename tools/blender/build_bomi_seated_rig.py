import sys
from pathlib import Path

import bpy


args = sys.argv[sys.argv.index("--") + 1 :]
input_blend = Path(args[0]).resolve()
output_blend = Path(args[1]).resolve()

bpy.ops.wm.open_mainfile(filepath=str(input_blend))
armature = bpy.data.objects["Bomi_Teacher_Rig"]


def add_target(name, location):
    target = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(target)
    target.location = location
    return target


temporary_objects = []
constrained_bones = []
for prefix, forearm_name, target_location, pole_location in (
    ("Left", "LeftForeArm", (0.20, -0.20, 0.96), (0.62, 0.10, 1.04)),
    ("Right", "RightForeArm", (-0.15, -0.20, 0.96), (-0.48, 0.10, 1.04)),
):
    target = add_target(f"__TEMP_{prefix}WristTarget", target_location)
    pole = add_target(f"__TEMP_{prefix}ElbowPole", pole_location)
    temporary_objects.extend((target, pole))

    forearm = armature.pose.bones[forearm_name]
    constraint = forearm.constraints.new("IK")
    constraint.name = f"__TEMP_{prefix}DeskIK"
    constraint.target = target
    constraint.pole_target = pole
    constraint.chain_count = 2
    constraint.use_tail = True
    constraint.iterations = 64
    constrained_bones.append(forearm)

bpy.context.view_layer.update()

pose_order = (
    "LeftArm",
    "LeftForeArm",
    "LeftHand",
    "RightArm",
    "RightForeArm",
    "RightHand",
)
visual_matrices = {
    name: armature.pose.bones[name].matrix.copy()
    for name in pose_order
}

for bone in constrained_bones:
    for constraint in list(bone.constraints):
        if constraint.name.startswith("__TEMP_"):
            bone.constraints.remove(constraint)
for target in temporary_objects:
    bpy.data.objects.remove(target, do_unlink=True)

bpy.context.view_layer.update()
for name in pose_order:
    armature.pose.bones[name].matrix = visual_matrices[name]
    bpy.context.view_layer.update()

armature.animation_data_clear()
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 1
bpy.context.scene.frame_set(1)
for name in pose_order:
    bone = armature.pose.bones[name]
    bone.keyframe_insert(data_path="location", frame=1, group="SeatedDeskPose")
    if bone.rotation_mode == "QUATERNION":
        bone.keyframe_insert(
            data_path="rotation_quaternion",
            frame=1,
            group="SeatedDeskPose",
        )
    else:
        bone.keyframe_insert(
            data_path="rotation_euler",
            frame=1,
            group="SeatedDeskPose",
        )
    bone.keyframe_insert(data_path="scale", frame=1, group="SeatedDeskPose")
if armature.animation_data and armature.animation_data.action:
    armature.animation_data.action.name = "SeatedDeskPose"

armature["malhaebom_default_pose"] = "SEATED_DESK_V1"
armature["malhaebom_pose_note"] = (
    "Arms bent forward and inward; intended for raised desk occlusion."
)
bpy.context.scene["malhaebom_character_version"] = "BOMI_FACE_RIG_V3_SEATED"

output_blend.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(output_blend))
print("BOMI_SEATED_RIG_CREATED", output_blend)
for name in pose_order:
    bone = armature.pose.bones[name]
    head = armature.matrix_world @ bone.head
    print("POSE_BONE", name, tuple(round(value, 5) for value in head))
