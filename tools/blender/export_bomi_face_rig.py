import sys
from pathlib import Path

import bpy


args = sys.argv[sys.argv.index("--") + 1 :]
input_blend = Path(args[0]).resolve()
output_glb = Path(args[1]).resolve()

bpy.ops.wm.open_mainfile(filepath=str(input_blend))

master = bpy.data.objects["Bomi_Teacher_Mesh"]
for key in master.data.shape_keys.key_blocks:
    key.value = 0.0
bpy.context.view_layer.update()

output_glb.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(output_glb),
    export_format="GLB",
    export_cameras=False,
    export_lights=False,
    export_animations=True,
    export_skins=True,
    export_morph=True,
    export_morph_normal=True,
    export_morph_tangent=False,
    export_extras=True,
)
print("BOMI_FACE_RIG_EXPORTED", output_glb)
