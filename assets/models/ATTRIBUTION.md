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

- 所有模型均为开放解剖参考资产的适配，不是本项目原创雕刻或本团队标本扫描。渲染、颜色、光照与展开位置用于展示，需与正式解剖学教材结合使用。
- 作者、整理者和数据机构不为本站背书。
- `manifest.json` 保存下载来源、字节数和 SHA-256；`scripts/prepare_models.py` 保存可复现的 Blender 加工过程。
- Blender 源文件位于项目根目录的 `blender/` 文件夹。
- 网站截图导出自动附加模型署名与许可文字。

## 前端第三方代码

- Three.js 0.170.0：[MIT License](../vendor/three/LICENSE)。包含 GLTFLoader、OrbitControls 和 BufferGeometryUtils。
- GSAP 3.12.5：© GreenSock，源文件保留许可头；适用 [GSAP Standard License](https://gsap.com/standard-license/)。
- 全部运行时脚本和模型本地提供，无 CDN 运行依赖。

## 新增五组模型 / BodyParts3D expansion

BodyParts3D, © The Database Center for Life Science (DBCLS), licensed under [Creative Commons Attribution-ShareAlike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/).

- 来源：[Kevin-Mattheus-Moerman / BodyParts3D](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D)，[上游内容许可](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/blob/main/LICENSE_content)。
- 原始 STL 的 FMA / BP 标识与名称记录于 expansion-sources.json；下载文件大小和 SHA-256 记录于 expansion-downloads.json。下载器 scripts/download_expansion.py 保留确切 URL。
- 改编：Blender 5.0 导入、保留源空间配准、网格减面（每部件最多约 12,000 面）、平滑法线、材质赋色、整体居中缩放、三点布光和封面渲染。膝部截取股骨远端与胫腓骨近端。
- 衍生文件：kidneys、brain、spleen、muscles、knee 的 .glb、-poster.png 与 blender/*-studio.blend，均继续按 CC BY-SA 2.1 Japan 分发。模型截图同样保留署名与许可。
- 双肾：左右肾外表面，不包含内部肾盂、肾锥体或肾血管。脑：37 个皮质、小脑、脑干部件，非完整深部解剖模型。肌肉：右肱二头肌长、短头。膝部：四件骨性结构，不包含关节软骨、韧带或半月板。脾脏：外表面。
- scripts/prepare_expansion.py 可复现加工，原始 STL 可用下载器重新取得；网页资产无需联网依赖外部模型服务器。

## 器官与关节结构扩充（2026-11-02）

下列五组同样来自 [BodyParts3D / DBCLS 的公开镜像](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D)，原始部件按 FMA ID 在 expansion-sources.json 中逐件记录，下载校验见 expansion-downloads.json。来源与衍生 GLB、PNG 封面、Blender 场景均采用 [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/)。

- **lungs**：右肺上、中、下叶及左肺上、下叶，共五个网格。保留源空间关系，给予相近但可区分的色调；不包含支气管树、血管和肺段标注。
- **liver**：肝脏外表面，一个网格；不含肝内血管、胆管或分段标注。
- **stomach**：胃外表面，一个网格；不显示胃壁层次或内部黏膜。
- **shoulder**：右锁骨、肩胛骨和完整肱骨三个网格，保留源配准；仅为肩部骨性关系，不含关节囊、软骨、肩袖或韧带。
- **foot**：右跟骨、骰骨、第二至五跖骨和足底长韧带，共七个网格。青绿色标识韧带、骨色标识骨骼；只包含这些局部结构，并非完整足部模型。封面使用足底斜视角方便观察韧带。

加工采用 scripts/prepare_expansion.py：Blender 导入原始 STL，保留相对位置，必要时减面至每部件约 12,000 面，平滑法线、赋色、统一整体尺寸，导出网格 GLB，布光后渲染。颜色和材质用于结构辨识，不代表真实组织色泽。无额外程序化解剖结构。
