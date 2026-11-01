# 智触人体 · 医脉相承

本次改版将模型展示拆为独立的「形态实验室」，以 Blender 处理的真实解剖网格替代原有 SVG 解剖插画。网站采用深色青灰、香槟金和冷暖光影，保留原有知识学习、题库、AI 助教与学习档案。

## 启动

双击 **启动网站.bat**，在浏览器访问 **http://127.0.0.1:8000**。需要已安装的 Python，无需安装额外依赖，也无需联网下载前端资产。

也可以运行 `python scripts/preview_server.py --open`。端口被占用时运行 `python scripts/preview_server.py --port 8001 --open`。

`index.html` 可以双击浏览首页及学习内容；三维展厅使用 ES Modules 和 GLB，需通过上述本地 HTTP 服务打开。`智触人体-单文件离线版.html` 已同步新版视觉并内嵌渲染图和脚本，可独立阅读和练习；完整三维交互仍在本地服务器上的独立展厅。

## 本次改动

- **独立三维展厅**：studio.html / studio.js / studio.css。不加载 app.js，不访问知识库、题库、学习记录或 AI 接口，不写入 localStorage。
- **两件模型**：心脏 11 个网格；全身骨骼 252 个网格部件（含牙齿等分块，不等于骨骼数量）。支持拖动旋转、滚轮/双指缩放、前后侧视角、选择、高亮、单独显示、聚焦、结构展开、原色/素模/线框、光强和色温、自动旋转、沉浸布局、带署名的 PNG 导出。
- **Blender 资产**：使用本机 Blender 5.0 实际导入、整理、材质处理、布光和渲染，保留可编辑 .blend 源文件。模型原型来自开放解剖资料，并非本项目原创雕刻或团队标本扫描。
- **视觉与动效**：首页重排、Blender 渲染主视觉、GSAP 分层入场、滚动显现、镜头缓动、指针视差和卡片光晕；支持键盘及系统减少动态效果设置。标签页隐藏时暂停三维帧循环。
- **学习区域解耦**：知识页与结构识别题去除旧 SVG，结构辨认题改为独立文字描述。既有本地学习记录和题目 ID 保持兼容。
- **完整本地依赖**：Three.js 0.170.0、OrbitControls、GLTFLoader、GSAP 3.12.5 均位于 assets/vendor，运行时无需 CDN。

## 目录

| 文件 | 用途 |
| --- | --- |
| index.html / app.js | 平台与学习功能 |
| experience.css / experience.js | 统一视觉与平台动效 |
| studio.html / studio.css / studio.js | 独立三维展厅 |
| assets/models/ | GLB、Blender 渲染封面、来源与校验清单 |
| assets/vendor/ | 本地前端插件与许可 |
| blender/ | heart-studio.blend、skeleton-studio.blend |
| scripts/prepare_models.py | 可复现 Blender 加工流程 |
| scripts/preview_server.py | 零依赖本地服务，仅开放网页及 assets |
| scripts/build_offline.py | 更新单文件离线阅读版 |
| backups/before-studio/ | 改版前文件备份 |
| server.py | 保留的可选 AI 后端，已支持新页面及脚本 |
| 启动网站.bat | 一键启动入口 |

重新导出与渲染模型：

```powershell
& 'E:/blender/blender.exe' --background --python scripts/prepare_models.py
python scripts/build_offline.py
```

scripts/upgrade_site.py 是已执行的一次性迁移记录，请勿重复运行。后续直接编辑网页文件。

## 模型来源与许可

心脏采用 BodyParts3D / DBCLS，经 OrganUI 整理的网格，适用 **CC BY 4.0**。骨骼采用 Open3Dmodel / Open Anatomy 来源、由 human-body-simulator 分发的模型副本，适用 **CC BY-SA 4.0**；本项目的骨骼衍生 GLB、渲染图和 Blender 文件保持同许可。

完整署名、来源链接、改动说明及校验值见 assets/models/ATTRIBUTION.md 和 assets/models/manifest.json，界面中也可以打开「模型来源与授权」。模型为教学参考，未经过本项目的专业解剖精度审校。骨骼部分对侧使用镜像补全，不能表达真实左右差异。心脏省略瓣膜及部分血管。Blender 程序化表面微细节用于渲染封面，网页实时模型采用 PBR 颜色和粗糙度。

## 可选 AI 后端

本次没有更改 AI 服务或接入新的 API。普通静态预览使用原有有限离线知识条目。若需要已有的服务端问答功能，按 .env.example 配置兼容服务后运行 python server.py；依赖见 requirements.txt。服务端密钥不放进浏览器。文本与视觉识别需要分别配置兼容模型。

原始项目活动照片仍来自用户提供的实践报告；历史访问量、问答规模与实践学时为报告记载，非网站实时统计。

## GitHub Pages 发布

仓库名：smart-body-anatomy。静态站点从 main 分支的 /docs 目录发布。

修改网站后运行 `python scripts/build_pages.py`，再提交并推送源码和 docs。网站的前端、模型和图片均使用相对路径，适配 GitHub Pages 的仓库子路径。

GitHub Pages 不运行 Python 后端；在线模型馆、知识学习、练习和浏览器本地学习记录可用，AI 助教使用现有离线知识问答。开放式 AI 与视觉模型仍需另行部署服务端。
