# 解剖形态实验室 · 模型来源与变更

## 心脏 / Heart

BodyParts3D, © The Database Center for Life Science (DBCLS), Japan.
Licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

- 官方来源：[BodyParts3D archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- [官方授权说明](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
- 网格整理及 GLB 来源：[OrganUI / heart-3d](https://github.com/organui/heart-3d)
- 原文件：`heart-source.glb`，来自上游 `public/models/heart.glb`。
- 上游署名记录：[heart-provenance.md](heart-provenance.md)。
- 本项目改编：Blender 5.0 导入、居中与统一尺寸、平滑法线、调整 PBR 颜色和粗糙度，导出 `heart.glb`；增加程序化表面微细节和三点布光后渲染 `heart-poster.png`。程序化微细节仅在 Blender 渲染图和 .blend 场景中，网页采用实时 PBR 材质。
- 衍生文件：`heart.glb`、`heart-poster.png`、`blender/heart-studio.blend`，保留 CC BY 4.0 署名与许可。
- 模型含 11 个网格；心室壁为合并结构，心室腔表面表示内部空间。未包含瓣膜、完整静脉系统及周围器官。不是患者个体模型或临床生理仿真。

## 骨骼 / Skeleton

Open3Dmodel / Open Anatomy lineage.
Licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

- 分发来源：[yamz8 / human-body-simulator](https://github.com/yamz8/human-body-simulator#skeleton-asset-and-derived-work)
- 原文件：`skeleton-source.glb`，来自上游 `public/models/overview-skeleton.glb`。
- 上游 README 将来源归为 Open3Dmodel / Open Anatomy，并声明 CC BY-SA 4.0；此处保留该署名链，不声称本项目为原作者。
- 本项目改编：Blender 5.0 解码 Draco，按 `.r` 命名的成对骨网格镜像补全对侧；中线骨和显式左/右网格保持原状。统一尺寸与位置、调整骨质色和粗糙度，导出未压缩的 `skeleton.glb`，增加灯光与表面细节后渲染 `skeleton-poster.png`。
- 衍生文件：`skeleton.glb`、`skeleton-poster.png`、`blender/skeleton-studio.blend`，均按 CC BY-SA 4.0 分发。截图中的模型同样适用此许可。此要求不改变独立网站代码的许可。
- 文件包含 252 个网格部件（包括牙齿等分块），该数字不是人体骨骼数量。部分对侧为镜像推定，不表达真实人体左右差异。

## 共同说明

- 两个模型均为开放解剖参考资产的适配，不是本项目原创雕刻或本团队标本扫描。渲染、颜色、光照与展开位置用于展示，需与正式解剖学教材结合使用。
- 作者、整理者和数据机构不为本站背书。
- `manifest.json` 保存下载来源、字节数和 SHA-256；`scripts/prepare_models.py` 保存可复现的 Blender 加工过程。
- Blender 源文件位于项目根目录的 `blender/` 文件夹。
- 网站截图导出自动附加模型署名与许可文字。

## 前端第三方代码

- Three.js 0.170.0：[MIT License](../vendor/three/LICENSE)。包含 GLTFLoader、OrbitControls 和 BufferGeometryUtils。
- GSAP 3.12.5：© GreenSock，源文件保留许可头；适用 [GSAP Standard License](https://gsap.com/standard-license/)。
- 全部运行时脚本和模型本地提供，无 CDN 运行依赖。
