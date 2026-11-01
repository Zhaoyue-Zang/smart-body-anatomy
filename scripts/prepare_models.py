"""Run with Blender 5: blender --background --python scripts/prepare_models.py.
Adapt licensed anatomy meshes, export GLB, render posters, and save editable scenes.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]

def look_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat('-Z', 'Y').to_euler()

def build(kind):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'assets/models' / (kind + '-source.glb')))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    print('SOURCE',kind,[(o.name, tuple(o.dimensions)) for o in meshes[:8]],flush=True)
    # Bake imported transforms first; source glTF Y-up is converted by Blender to Z-up.
    for o in meshes:
        world = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = world
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:o.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    # Source skeleton has paired right bones only. Reflect paired bones about the sagittal plane.
    if kind == 'skeleton':
        for o in list(meshes):
            if '.r' in o.name.lower():
                copy=o.copy();copy.data=o.data.copy();bpy.context.collection.objects.link(copy)
                copy.name=o.name.replace('.r','.l')
                copy.matrix_world=Matrix.Diagonal((-1,1,1,1)) @ o.matrix_world
                meshes.append(copy)
    points=[o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
    low=Vector(tuple(min(v[i] for v in points) for i in range(3)))
    high=Vector(tuple(max(v[i] for v in points) for i in range(3)))
    center=(low+high)/2
    scale=3.3/max(high-low)
    for o in meshes:
        o.location=(o.location-center)*scale
        o.scale*=scale
        for p in o.data.polygons:p.use_smooth=True
    bpy.context.view_layer.update()
    for mat in bpy.data.materials:
        mat.use_nodes=True
        nodes=mat.node_tree.nodes;links=mat.node_tree.links
        bsdf=next((n for n in nodes if n.type=='BSDF_PRINCIPLED'),None)
        if not bsdf:continue
        bsdf.inputs['Metallic'].default_value=0
        bsdf.inputs['Roughness'].default_value=.38 if kind=='heart' else .52
        if kind=='skeleton':bsdf.inputs['Base Color'].default_value=(.69,.59,.43,1)
        else:
            c=bsdf.inputs['Base Color'].default_value
            # Keep vessel distinctions; deepen flat study colors into restrained tissue tones.
            bsdf.inputs['Base Color'].default_value=(max(.04,c[0]*.6),max(.025,c[1]*.4),max(.02,c[2]*.4),1)
        noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=85
        noise.inputs['Detail'].default_value=3
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.17;bump.inputs['Distance'].default_value=.018
        links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:o.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Mesh-only export; studio lights remain in the Blender scene, not the web asset.
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/models'/f'{kind}.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False)
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=40
    scene.cycles.use_denoising=True
    scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.world=bpy.data.worlds.new('Studio ambient');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.19,.22,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
    bpy.ops.object.camera_add(location=(1.4,-7.8,.9) if kind=='heart' else (2,-8,1))
    camera=bpy.context.object;look_at(camera,(0,0,0));camera.data.type='ORTHO';camera.data.ortho_scale=4.25;scene.camera=camera
    for name,position,color,power,size in [
        ('Warm key',(-3,-4,5),(1,.82,.64),600,4),
        ('Soft fill',(4,-2,1),(.57,.76,1),400,3),
        ('Champagne rim',(1,3,4),(1,.72,.4),850,3)]:
        bpy.ops.object.light_add(type='AREA',location=position)
        light=bpy.context.object;light.name=name;light.data.energy=power;light.data.color=color;light.data.shape='DISK';light.data.size=size;look_at(light,(0,0,0))
    scene.render.filepath=str(ROOT/'assets/models'/f'{kind}-poster.png')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/f'{kind}-studio.blend'))
    bpy.ops.render.render(write_still=True)
    print('FINISHED',kind,flush=True)

for kind in ['heart','skeleton']:build(kind)
