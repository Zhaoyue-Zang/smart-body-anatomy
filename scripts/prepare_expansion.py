"""Blender 5: assemble licensed anatomical STL meshes, export GLBs and posters."""
import bpy, bmesh, json, math, hashlib, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
SPEC=json.loads((ROOT/'assets/models/expansion-sources.json').read_text())
COLORS={'kidneys':(.36,.085,.07,1),'brain':(.58,.34,.30,1),'spleen':(.27,.07,.13,1),'muscles':(.43,.095,.07,1),'knee':(.67,.57,.40,1)}
COLORS.update({'lungs':(.55,.29,.30,1),'liver':(.29,.075,.045,1),'stomach':(.57,.30,.24,1),'shoulder':(.67,.57,.40,1),'foot':(.67,.57,.40,1)})
LABELS={'FMA7204':'右肾','FMA7205':'左肾','FMA7196':'脾脏','FMA37684':'右肱二头肌短头','FMA37686':'右肱二头肌长头','FMA24474':'右股骨下端','FMA24477':'右胫骨上端','FMA24480':'右腓骨上端','FMA24486':'右髌骨'}
LABELS.update({'FMA7333':'右肺上叶','FMA7383':'右肺中叶','FMA7337':'右肺下叶','FMA7370':'左肺上叶','FMA7371':'左肺下叶','FMA7197':'肝脏','FMA7148':'胃','FMA13322':'右锁骨','FMA13395':'右肩胛骨','FMA23130':'右肱骨','FMA24497':'右跟骨','FMA24528':'右骰骨','FMA24509':'右第二跖骨','FMA24511':'右第三跖骨','FMA24513':'右第四跖骨','FMA24515':'右第五跖骨','FMA44249':'右足底长韧带'})
def aim(o):o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
def build(kind,parts):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    meshes=[]
    for part in parts:
        bpy.ops.wm.stl_import(filepath=str(ROOT/'assets/models/sources'/(part['id']+'.stl')))
        o=bpy.context.object;o.name=part['id'];o['sourceName']=part['name'];o['sourceId']=part['id']
        label=LABELS.get(part['id'])
        if not label:
            label='小脑' if part['id']=='FMA67944' else '脑干' if part['id'] in ['FMA61993nsn','FMA62004','FMA67943'] else '左侧大脑皮质' if part['name'].startswith('left') else '右侧大脑皮质' if part['name'].startswith('right') else '眶面脑回'
        o['groupLabel']=label
        if len(o.data.polygons)>12000:
            mod=o.modifiers.new('Web mesh reduction','DECIMATE');mod.ratio=12000/len(o.data.polygons)
            bpy.ops.object.modifier_apply(modifier=mod.name)
        for face in o.data.polygons:face.use_smooth=True
        mat=bpy.data.materials.new(label);mat.diffuse_color=COLORS[kind];mat.use_nodes=True
        bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bsdf.inputs['Base Color'].default_value=COLORS[kind];bsdf.inputs['Roughness'].default_value=.46
        if kind=='brain' and label in ['小脑','脑干']:bsdf.inputs['Base Color'].default_value=(.42,.28,.21,1)
        if kind=='muscles' and '短头' in label:bsdf.inputs['Base Color'].default_value=(.55,.16,.105,1)
        if kind=='foot' and part['id']=='FMA44249':bsdf.inputs['Base Color'].default_value=(.12,.42,.40,1)
        if kind=='lungs':
            shades={'FMA7333':(.55,.29,.30,1),'FMA7383':(.62,.35,.29,1),'FMA7337':(.46,.23,.27,1),'FMA7370':(.56,.32,.34,1),'FMA7371':(.47,.25,.30,1)}
            bsdf.inputs['Base Color'].default_value=shades[part['id']]
        o.data.materials.clear();o.data.materials.append(mat);meshes.append(o)
    if kind=='knee':
        femur=next(o for o in meshes if o.name=='FMA24474')
        zmin=min(v.co.z for v in femur.data.vertices);zmax=max(v.co.z for v in femur.data.vertices)
        # Retain the distal femur and proximal tibia/fibula around the existing joint alignment.
        extent=(zmax-zmin)*.22
        for o in meshes:
            bm=bmesh.new();bm.from_mesh(o.data)
            for z,normal in [(zmin+extent,(0,0,1)),(zmin-extent,(0,0,-1))]:
                bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.0001,plane_co=(0,0,z),plane_no=normal,clear_outer=True,clear_inner=False)
            bm.to_mesh(o.data);bm.free();o.data.update()
    bpy.context.view_layer.update()
    points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
    lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
    center=(lo+hi)/2;scale=3.3/max(hi-lo)
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:o.location=(o.location-center)*scale;o.scale*=scale;o.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/models'/f'{kind}.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
    scene.render.resolution_x=560;scene.render.resolution_y=600;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
    scene.world=bpy.data.worlds.new('Studio ambient');scene.world.use_nodes=True;next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.16,.19,.22,1)
    camera_position=(2,-7,1.5) if kind=='brain' else (3,-5,-5) if kind=='foot' else (1.5,-8,.8)
    bpy.ops.object.camera_add(location=camera_position);cam=bpy.context.object;aim(cam);cam.data.type='ORTHO';cam.data.ortho_scale=4.1;scene.camera=cam
    for pos,col,power in [((-3,-4,5),(1,.82,.68),600),((4,-2,1),(.60,.78,1),400),((1,3,4),(1,.72,.4),700)]:
        bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.color=col;o.data.shape='DISK';o.data.size=4;aim(o)
    scene.render.filepath=str(ROOT/'assets/models'/f'{kind}-poster.png')
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/f'{kind}-studio.blend'))
    bpy.ops.render.render(write_still=True)
    print('FINISHED',kind,'meshes',len(meshes),flush=True)
requested=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for kind,parts in SPEC['models'].items():
    if not requested or kind in requested:build(kind,parts)
