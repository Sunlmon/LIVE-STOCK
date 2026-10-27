# 2026-10-27 最新：固定完成页与手动查看结果（当前版本）

- 删除完成页的八秒截止逻辑，保留机器 450ms 淡出、页面 350ms 淡入。完成后显示“本轮分流完成”和“查看结果 / View results”按钮，始终停留；淡入前按钮禁用且有状态保护，完成后启用并可键盘操作。重复确认无效，重开清除确认状态。完全淡出后不再重复绘制机器。
- `node --test tests/*.test.mjs`：72 项通过，0 失败。修订原计时测试为长期停留、时钟封顶而不自动确认、提前点击拒绝、单次确认和重置；静态检查两种语言都有结果按钮且完成页只有一个操作。
- Chrome 从 45 只物理开发样本开始，实际发射四只（其中一只返回后重发），等待出口全部复位后显示完成页。额外等待 20 秒受控可见时间仍未进入第三阶段，机器与结果没有改变。鼠标点击后正常进入完整第三阶段，原褪色、符号、骷髅、消散、统计和重开通过。
- 已测试提前合成点击被拒绝、重复确认不改变已创建的揭示、四种窗口中的按钮可见/居中/不越界。另用外部传感器诊断夹具到达英文完成页，确认 View results 标签，原生 Enter 进入揭示；该夹具不是自然飞行轨迹。重开后页面隐藏、按钮重新禁用，没有未捕获异常。
- 目视核对了桌面与 320px 窄屏截图。第一阶段没有重新跑浏览器满屏流程；其自动回归通过。物理、出口动画、动物素材和 `reveal.js` 与上一版哈希相同。实体手机、Safari/Firefox 和真人复测仍未执行。

手动检查：完成四只分流后不操作，确认页面一直停留；点击“查看结果”，或聚焦按钮按 Enter，再确认进入原有动物揭示动画。

---

# 2026-10-27：完整出口处理与八秒完成过渡（历史）

## 实现与自动验证

- 出口增加金属厚边、石墨灰后壁、侧壁与下腔；碰撞体、判定线、八槽四类顺序、动物直径与发射参数未变。动物完全越线后只记录一次，移除刚体并捕获其最后位置、角度和物种；后续是视觉事件，不会再触发传感器。
- 单次视觉时间为 180ms 入腔、300ms 扫掠转化、80ms 完整符号、180ms 开盖、320ms 加速下落、240ms 合盖，共 1300ms。复位后才装填下一只；最后一只结束前不标记整轮完成。返回发射轨道的同一只动物仍允许真实重发。
- 机器冻结后独立进入完成状态：450ms 淡出机器、350ms 淡入文字，完全显示后保持 8000ms；首个完全可见帧的余量不会缩短停留。页面隐藏时暂停，不用 `setTimeout` 猜测出口结束。
- `node --test tests/*.test.mjs`：**72 项通过，0 失败**。新增覆盖六段连续状态、18 种阶段/边界时间、掉落加速、最后真实位置、八个传感器只记录一次、纯视觉期物理不步进、第四只等待复位、四类重复零结果、完成后冻结、完整八秒、帧越界余量、隐藏暂停，以及各处理/过渡阶段的重置。四出口绘制的无物理副作用与淡出透明度也已检查。
- 第一轮旧测试仍假定出口记录后立即装填，出现一个体数断言失败；将测试更新为等待新的复位状态后，全套通过。浏览器脚本一次因外部测试的异步导入语法中断，修正后重跑；这些失败未计为通过。

## 已实际运行的 Chrome 检查

- 两轮正常 START 流程：真实点击领养 1 只后，分别繁殖到 558 / 551 只并完成容量确认。四球均观察到 `arrive → transform → formed → open → drop → close`，可见处理约 1.30–1.32 秒（帧采样误差）；第一轮有一次自然返回并再次拉杆发射同一只。实际出口分别为 0/2/1/0 和 1/2/2/3，保留真实重复结果，不强制四种齐全。
- 验证记录前整球已越过原线，视觉事件创建时刚体已移除；视觉期点击拉杆无效，结果、事件各只有四条。第四只复位后无动物刚体，物理世界与装置在完成提示期间保持不动。
- 完成页可见文本只有“本轮分流完成”，无按钮、图标或统计；中英文和 1440×900、390×844、320×568、844×390 下文字居中且不裁切。额外隐藏页面 2 秒不消耗停留时间；受控帧时钟中完整可见到第三阶段约 8.033 秒。
- 另一次使用浏览器原生 `requestAnimationFrame` 与 `performance.now()` 实测，从文字完全可见后继续显示 **8001.9ms** 才进入第三阶段（不是加速模拟时钟）。未修改第三阶段的揭示、符号停留、骷髅、消散或结尾；551 / 558 只完整快照到最终双语统计、图标说明、百分比与原生重开均通过，没有未捕获异常。
- 四个出口分别采用外部诊断传感器夹具检验绘制和复位，得到 1/1/1/1；此定位仅在测试中使用，**不属于自然飞行，也不是作品中分配出口的代码**。出口处理中原生重开成功；完成提示期间通过同一重开处理函数的合成调用重置后，再等 10 秒也未出现旧提示或第三阶段。完成页本身没有新增重开按钮。
- 已目视检查出口转化、半开、下落中段及完成页截图。第一阶段文件、物理配置、视口与 `src/reveal.js` 的哈希和原项目一致；最终结尾 HTML 区域与文案也未变。真实手机、Safari/Firefox、真人节奏复测和帧率基准仍未执行。

## 手动复测

1. 用根目录 `serve.ps1` 启动，访问 `http://localhost:8000/`，正常领养、等待满屏、点击确认。
2. 用不同拉动深度发射。观察球完整进入后才开始转化；处理期间拉杆不能发射，合盖后才出现下一只。若返回发射轨道，再拉动同一只。
3. 第四只处理完成前不要出现完成页；合盖后机器淡出，中央仅有完成文字，完全显示后约 8 秒才进入原揭示。
4. 动画中点击原有重开，确认领养计数、动物、物理对象与出口事件归零；完成整轮后在原结尾重开，观察无旧提示残留。用窄屏重复检查。
5. 快速检查物理阶段可访问 `/?stage=physics`，这只使用真实的 45 只开发样本，不冒充满屏快照。

---

# 2026-10-27：已确认的混选动物图标

- 正式 `SPECIES` 改为五种 B 版（猫、狗、兔子、仓鼠、金鱼）加 A 版鹦鹉。SVG 独立包含线条、填充和五官颜色，不依赖预览页的 CSS、`symbol` 或 `use`。物种 key、顺序、标签、100×100 viewBox、游戏圆圈直径及后续所有行为函数保留。
- Node.js：`node --test tests/*.test.mjs`，63 项通过，0 失败。新增混选版本、六物种映射、SVG 自包含、统一预览色值/线宽以及第一阶段和物理动物尺寸不变的检查。
- Chrome 逐一将正式 SVG 与选定预览路径渲染成 100px、48px、28px 的 Canvas；共 18 组 RGBA 比较完全一致，六个图像均成功解码。封面与物理装置两侧的更新截图已目视核对。
- 正常 START 流程在 556 只时进入容量说明，点击确认后进入物理装置。另用 45 只开发快照实际完成四球分流，其中一次返回后重发，再到停止、褪色、符号、骷髅、消散、双语结尾及重新开始，没有未捕获异常。封面和结尾分别检查了四种窗口尺寸；这不是新的真人试玩，也不是帧率基准。
- 本轮只更换图形定义与对应测试、文档、截图，不改繁殖、领养、粒子、物理几何、发射力、出口判定或结尾时序。

---

# 2026-10-27：结尾故事与拉杆隐喻

- 只调整结尾的 HTML 文案结构与中英文词典；新标题为“看不见的滞销动物，去了哪里？”，正文五段说明清空、繁育与购买力失衡、可能去向、拉杆隐喻和反对过度繁育的倡议。数据说明尾段精简，非现实概率和继续繁育不等于死亡的限定保留。
- Node.js：`node --test tests/*.test.mjs`，61 项通过，0 失败。新增叙事顺序、HTML 中文回退与词典一致、双语隐喻与倡议、数据限制的检查；原有繁殖、末轮等待、物理出口与结尾动画测试继续通过。
- Chrome 独立配置目录，以 `?stage=physics` 的 45 只开发样本开始，实际操作四次发射，其中一只返回后重发一次，四只均完成真实出口判定。随后停止、褪色、结局图标停留至少 2 秒、骷髅消散、结算和重新开始通过，没有未捕获异常。
- 结尾在 1440×900、390×844、320×568、844×390 中检查中英切换、结果不重抽、无横向溢出和重开按钮可滚动到达；并检查正文元素不越过文本列。桌面及窄屏截图已经目视核对。本轮没有重新跑正常 START 到 550–580 只的浏览器全流程，也未修改其逻辑；物理浏览器样本不是现实数据或新的人类试玩。

---

# 2026-10-26：按钮减半与确认页精简

- START 桌面尺寸从 420×112px 调整为 210×56px；确认、结尾重开从约 420×108px 调整为 210×54px，窄屏高 44px。语言按钮缩紧为至少 28×22px，其他工具按钮最小高度 24px，保留 10–11px 字号。胶囊渐变、原始点击语义不变。
- 删除容量确认页的重开按钮和对应事件绑定，操作区只留确认；实际物理装置的重开、错误重试没有删除。静态 HTML 回归检查只有一个确认操作，也检查不残留对已移除元素的监听。
- Node.js：60 项测试通过，0 失败。Chrome 实测 4 种开场与确认页尺寸、中英文切换、START 鼠标与 Enter 激活、hover/按下、确认后仅创建一个物理世界。额外等待 10 秒不会自动确认，重复确认不重建世界。
- 缩小工具按钮后，物理装置在 10 种窗口尺寸下仍与绘制、拉杆坐标对齐，拖动与取消检查通过，无未捕获异常。本轮没有重新进行四球到结尾的完整浏览器回归；原有物理与结尾仍由 Node 测试覆盖。不是新的真人试玩，也不是实体手机测试。
- 另外从正常 START 开始的一轮在 580 只时显示容量说明，入场动画完成后截图；点击确认正常进入物理装置，截图更新为当前小按钮版本。

---

# 2026-10-26 上一版：550–580 随机结束与高级灰胶囊按钮（历史）

- 每轮开始时采样一次 550–580 的整数作为 `populationLimit`；本轮的繁殖容量、结束判定与快照使用同一个值。不在渲染、领养、切换语言或重试物理时重抽；重开才重新采样，两轮偶然相同是允许的。几何容量保护已允许 580，不再把高端阈值截断为较小数值。
- 到达本轮上限后，仍锁定点击并等待所有已生成幼崽完成动画，之后停在手动确认页。中文按钮只写“确认”，英文 Confirm，删除了下方提示元素与两种语言中的对应键。
- 统一所有 HTML 按钮为高级灰渐变胶囊：主要入口使用约 420×108–112px，窄屏自适应；顶部工具按钮保持紧凑，但使用相同的 `#62645F` → `#A7A9A3` 渐变、高光和光晕材质，增加细微文字阴影，语言选中态由外缘细环表示。去掉所有按钮中的箭头、图标和编号，不改变开场其他文案、动物、背景或页面结构。保留原始点击监听与键盘语义。
- Node.js 24：`node --test tests/*.test.mjs`，**60 项通过，0 失败**。覆盖全部 31 个可能阈值、550/565/580 三个边界场景、随机阈值稳定与重开采样、末尾空位动画、最后一轮等待、手动确认防重入、双语文字与原有物理/结尾回归。
- Chrome 已检查 START 在 1440×900、390×844、320×568、844×390 下的胶囊外形、指定灰色渐变、暖白文字、无箭头/图标、hover、按下与原生 Enter 启动。两种语言下可见按钮均检查为胶囊渐变表面。确认页只保留 Confirm/确认，已删除提示行；可见时间增加 10 秒后仍未自动进入装置。
- 一个正常 START 样本在 **566 只**时锁定，244 只幼崽继续完成动画；12 次原生点击加合成点击未新增领养或粒子。之后仅在确认时创建一个物理世界，重复确认没有重建。
- 另一轮在 **557 只**锁定并完成最后分裂；完整流程中还保留了 **578 只**未领养快照，四只动物真实分流后，整屏揭示、双语结算、百分比合计、图标说明和重新开始均通过，无未捕获异常。装置在 10 种窗口下仍与碰撞和指针坐标对齐。
- 首次较长回归在一次性模拟 2,100 帧返回等待时发生 CDP 测试超时，随后改为每批 60 帧并完成回归。没有把失败尝试当作成功；分批只调整外部测试，不更改游戏的时间或物理步长。本轮浏览器的首组四球未自然返回；返回重发仍有自动物理回归覆盖。
- 最终统一配色后再次检查 4 种开场尺寸、每个开场与物理工具按钮的两个指定渐变端点、实际确认页及点击进入物理场景；本次确认样本为 559 只。截图均使用入场完成后的稳定画面，见 `screenshots/capsule-*.png`。没有切换为深色背景。

本次自动测试与受控浏览器时钟不是新的真人试玩或 FPS 基准。实体手机、Safari/Firefox 和本轮真人复测仍待完成；既有历史测试保留在下方，但旧的固定 550 和直角按钮不代表当前版本。

---

# 2026-10-26 上一版：550 只、手动确认与实验启动键（历史）

## 修改与自动检查

- 第一阶段只在屏幕中达到 550 只时进入结束等待，密度条不再提前结束。几何容量参数允许容纳 550，只作为数量保护，不改变动物大小或物理阶段。
- 基础繁殖间隔为 4.4 → 3.61 → 2.96 → 2.43 → 2.2 秒，保留 ±14% 的有界变化；初期较上一版稍缓。最后剩余 1–3 个空位按实际空位数生成，照常播放完整位移动画。临近容量仍排程存活来源，每窝按即时空位生成，以免持续领养时卡在上限前；不会突破 550。
- 达到 550 后立即锁定领养和新轮次，最后一轮完整播放，然后进入现有说明页。删除自动倒计时，只通过“确认，进入分流装置”继续。确认有一次性保护，重开清除确认状态。
- START 改为断环触点 SVG、直角边框、细内框和轻微底边厚度。hover 轻微变色，按下下沉 2px；没有箭头、胶囊轮廓或持续图标动画。

Node.js 24：`node --test tests/*.test.mjs`，**58 项通过，0 失败**。新增及修订检查包括 549 只/高密度不结束、550 只/低密度仍结束、最后出生动画等待、余下 1–3 个位置补足、确认只响应一次和重置确认。原有物理、重发、出口、语言与结尾回归继续通过。

三个种子 × 不点击 / 每秒领养 3 只 / 每秒领养 6 只的 9 个受控样本均到达精确 550，并完成最后动画；本次逻辑时钟测得约 16.7–19.82 秒。这不是真人耗时或帧率测量，不能推出任意操作策略都必然按该时长结束。

## 已执行的浏览器检查

- Chrome 本地独立配置目录：START 在 1440×900、390×844、320×568、844×390 中可见、无箭头、保持直角；hover、按下与原生 Enter 激活通过，中英文切换不改变游戏。
- 正常 START 达到 550 时，实际观察到 231 只动画尚未完成；等待后动画全部完成，数量仍为 550。12 次原生点击和额外合成点击均未增加领养或粒子。
- 550 只说明页在额外 10 秒受控可见时间后仍停留，没有创建物理世界。点击确认才创建一个世界，重复确认不创建第二个。
- 单独说明页检查了中英文及四种窗口尺寸；等待、隐藏页面与重新开始均不自动进入物理阶段。
- 后续完整回归通过：物理装置仍在 10 种窗口尺寸下对齐；四只动物真实通过出口（含一次返回重发），45 只开发样本与正常 START 的 550 只快照均完成揭示、结算和重新开始，无未捕获异常。未修改 Matter.js 的力、碰撞几何、出口检测或四只限制。

首次浏览器测试缺少键盘焦点模拟，补齐后通过；后续一次性模拟 3,600 个高密度冻结帧使 CDP 调用超时，改为短批次验证。失败尝试不记为成功。浏览器时钟测试不等同于真实播放速度；实体手机、其他浏览器与真人复测仍待完成。

下方记录保留为开发历史，旧的自动倒计时、结束阈值、繁殖参数和测试数量不代表当前版本。

---

# 2026-10-26 第一轮：根据试玩反馈的迭代验证（历史）

本节记录同日第一轮修改，此后被上方的 550 只与手动确认版本继续调整。

## 本轮修改

- 第一阶段基础繁殖间隔从 4.0 秒逐轮缩短到 2.2 秒，加入 ±14% 的有界波动，最低仍为 2.2 秒；保留 1.4 秒幼崽位移动画、错峰、容量判断、最后一轮动画等待和点击锁。
- 每只物理动物在装填时有最多 ±3.5 逻辑像素的水平公差；在飞行或重发时不重新采样、不增加推力、不改变实际出口。记录保留 `seatOffsetX`。
- 下一只装填时提示上次力度；第三阶段每类结局新增双语文字说明。真人反馈见 `PROCESS.md`，不是由自动脚本编造。

## 已执行的自动检查

Node.js 24 执行 `node --test tests/*.test.mjs`：**57 项通过，0 失败**。

- 原有 241 档力度扫描、四只动物上限、重发同一刚体、整球越线才记录、只记录一次、零结果出口与重置等回归继续通过。
- 精确路线回归使用居中装填的固定测试条件；新增测试单独覆盖生产版本的装填公差，不依赖偶然随机通过。
- 固定力度 180、220、240 各扫描 29 个装填偏移，实际出口计数（从左往右）分别为 `[2, 6, 5, 16]`、`[7, 1, 10, 11]`、`[14, 3, 4, 8]`。这些样本包含测试用户对返回动物的再次发射，不是自然发生概率，也不是保证单轮四出口齐全。它们同时显示装置仍可能存在出口偏向。
- 三个固定种子（11、31、97），分别模拟不点击、每秒领养 3 只、每秒领养 6 只；从第 3 秒开始点击，优先移除尚未繁殖的来源。9 个受控样本均在约 15.5–19.3 秒完成最后一轮动画，数量未超现有上限。这是逻辑时钟结果，不是真人完成时间或 FPS 测量；更快点击或其他输入策略不在该结论范围内。
- 结束等待、禁用领养、语言字典完整性、模拟与真实结果分离、2.5 秒符号停留与重新开始等测试仍通过。

## 已执行的 Chrome 检查

本地静态预览，独立临时 Chrome 配置目录，原生鼠标事件加受控动画时钟：

- 完成 45 只开发样本及正常 START 生成的 461 只未领养快照的全流程；四只实际物理动物完成后，揭示、结算与重新开始正常，无未捕获异常。
- 首轮四球检查中实际记录出口依次为第 1、4、3、2 个；这只是该次检查，不是预设顺序。该次运行没有遇到返回通道的球；随后独立浏览器复测实际完成了 5 次返回后重发，保持同一刚体、同一动物名额，并完成了 486 只快照的结尾。复测同时检查了四项新增说明与中英文切换；并未要求每轮四出口齐全。
- 最后一轮触发结束时有 151 只动物仍在动画中，等待后均完成；12 次原生点击没有新增领养或粒子，之后仅创建一个物理世界。
- 装置检查了 10 种窗口尺寸，包含 1920×1080、1440×900、1024×768、768×1024、390×844、320×568 和 844×390 等；图形、刚体与交互坐标对齐。检查了下限拉动不发射、拖动时缩放取消蓄力、DPR 2 对齐。
- 中英文切换不重置游戏，缺失 Matter.js 时有错误反馈；语言偏好保存与禁用存储情况下的降级可用。
- 结尾在 1440×900、390×844、320×568、844×390 无横向溢出，重新开始可滚动到达。新图标文字说明已通过截图检查；桌面及窄屏截图保存在 `screenshots/iteration-ending-desktop.png` 与 `screenshots/iteration-ending-mobile.png`。

首次在受限浏览器环境中检查时，CDP 在 `Runtime.enable` 超时；获得本地浏览器检查权限后重新运行完成。没有把失败尝试记成成功。

## 建议真人复测

1. 用普通首页从 START 玩到结尾，不用开发快捷入口。观察第一阶段是否仍长期僵持、分裂是否完整。
2. 第二阶段先连续使用近似力度，再主动尝试浅、中、深拉动。记录实际力度与出口；不要把一轮重复误认为所有力度都没有区别。
3. 确认第二阶段仍只有抽象出口图标，结尾四项解释能帮助理解；切换 English 检查说明与上次力度提示。
4. 故意在拖动时缩放、切换语言或切到其他窗口，应取消拉动而不多发一只动物。
5. 重新开始后应回到 45 只、领养 0、没有旧出口与结算残留。

尚未完成：本轮修改后的真人复测、实体手机、Safari/Firefox、长时间压力测试、真实帧率测量与线上部署。不要用上述自动检查替代它们。参考图出处与试玩是否在讲解前开始，也需要作者按事实补充。

---

# WIP 3 checks — 20 October 2026

## Latest pass: Chinese / English interface

Six native-button language groups now appear on the cover, stage-one HUD, capacity notice, physical-stage HUD, reveal HUD and ending page. Static text, page title, accessibility labels, dynamic physics hints/charge/progress/error messages, reveal descriptions, fate labels and both ending summaries use the local dictionaries in `src/i18n.js`. Existing Chinese copy is preserved. The animal artwork, English Adopted stamp, physical forces/geometry, breeding cadence, finishing lock, capacity timing, reveal timing, fate indices and simulation weights are unchanged. Header wrapping is measured by the existing viewport/ResizeObserver path, so translated text does not leave a stale physics/input transform.

The default is Chinese. Only `live-stock-language` is persisted in this browser's localStorage; no game score, nickname, snapshot or external credential is stored. Storage errors are caught: switching still works within the page, but cannot persist when storage is blocked. Switching updates existing text/nodes rather than restarting gameplay, re-creating a world, rerolling outcomes or resetting a clock. If a lever is currently held, switching cancels that pull safely as resizing already does, without spending an animal or firing it.

All **52** automated tests passed. Eight new i18n cases check complete matching dictionaries/placeholders, every HTML translation/aria key, six switch groups, unchanged numeric interpolation, stable four-outlet label ordering, English translations of existing physical errors, preference persistence/defaults, blocked storage and DOM text/pressed-state updates.

```powershell
node --test tests/i18n.test.mjs tests/breeding.test.mjs tests/capacity-notice.test.mjs tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

Chrome exercised actual language-button clicks on all six screens, including an in-flight first-stage ending window, physical flight and the reveal. Between English/Chinese clicks with the controlled clock held still, animal/adoption counts, world count, every body ID/position/velocity, exit records and final numeric results matched exactly; language changes did not advance the controlled clock. All six selected-button groups updated together. Apart from the deliberately bilingual Chinese language-selector label, visible English text contained no unlocalized Chinese. Native clicks confirmed preference retention after reload; a deliberately blocked localStorage getter still allowed switching. Switching with a live lever drag cancelled it without a launch, replacement body or spent animal.

The cover, capacity notice and ending were checked in both languages at 1440×900, 390×844, 320×568 and 844×390. The translated physical header was checked across the existing ten-size matrix, with native dragging, uniform apparatus fit, decoration clearances and DPR-2 alignment retained. English desktop/narrow cover, physical stage, notice, first-stage HUD and ending captures were visually inspected. The 320px cover and long ending remain vertically scrollable; the full ending prose and restart are reachable, with no horizontal overflow. Missing-vendor feedback was also checked in both languages.

The complete regression included the 45-animal development sample and a real 459-animal saturated snapshot, four actual animal outcomes with a natural returned-ball relaunch, the 2.5-second fate hold, full reveal, ending and native restart. Capacity pause/continue/reset and finishing-stage click lock were rerun. No uncaught JavaScript exceptions occurred. These are controlled-clock Chrome checks, not human usability tests, device FPS measurements or a physical phone trial; Firefox/Safari and public deployment remain unverified. No commit, push, publication or leaderboard service was added in this pass.

Manual check: Ctrl+F5 the local page, use 中文 / EN on each screen, adopt an animal before switching, and verify its counter stays unchanged by the language choice. During physical flight switch languages and continue playing; if switching while pulling, expect a cancelled pull rather than a shot. At the ending, check all four counts and percentages remain identical across languages. Reload to check the saved choice, then select Chinese again if desired.

## Latest pass: finish the final wave before the existing capacity notice

The first stage now latches a `finishing` state on the unchanged visual-density threshold or existing geometry-based population limit. No threshold values, animal caps, litter counts, breeding cadence, offspring movement or packing parameters changed in this pass. Native Canvas input becomes inert immediately; the existing active-only pointer/adoption guard also rejects synthetic input. The breeding entry point rejects new waves outside `active`, while the already scheduled final wave is still advanced. Redistribution cannot cancel the latched ending or restore adoption.

The Canvas continues rendering in `finishing`. Entry to the existing capacity notice requires an empty parent queue, no pending source timestamp, and every delayed/in-flight child's actual `birth.complete` flag. The previous fixed saturation delay, estimated busy-until time and packing timeout no longer decide this transition. Existing particles may finish fading, but no new adoption particles are emitted. The capacity page, text, design, 4.4-second continuation, Matter.js physics, outlets and subsequent reveal/ending remain unchanged. Restart clears the waiting mode and queues. The earlier optional leaderboard plan has been cancelled; no leaderboard code or data service was added.

All **44** automated tests passed. Six additional cases cover the exact existing threshold boundaries, irreversible click/new-wave locking, completion of the queued wave without cutting off litters, delayed/unfinished newborns blocking transition regardless of elapsed time, immediate eligibility when animation is already complete, and restart restoring normal adoption/breeding. Repeated transitions are rejected. One regression sets the estimated busy-until time far into the future and proves that real animation completion, rather than that timer, is decisive.

Chrome also observed a natural in-flight ending window with the first-stage HUD still visible, the existing notice still hidden, and the Canvas still drawing animals. Twelve native clicks plus one synthetic pointer event during that window caused no additional adoptions or particle emissions. The notice appeared only after the tracked births completed, without a physical world being created early. Manual continuation created exactly one Matter world; duplicate continuation did not create another. A separate full regression completed four actual physics animals (including a returned-ball relaunch) and both 45-animal and 490-animal reveals/endings, then restarted normally; no uncaught exceptions occurred. Final-page checks at desktop and narrow sizes and missing-library recovery also passed. These use a controlled browser clock, not a human trial or real-time FPS benchmark. Physical phones and other browsers were not tested.

Manual checks for this pass:

1. Run the existing local server, open the normal root URL and refresh with Ctrl+F5. Below the threshold, confirm adoption counts/particles and breeding still work.
2. Stop adopting near capacity. Watch the last moving/delayed offspring finish, without an early notice or blank Canvas. If no offspring remain when the threshold is reached, the notice may appear immediately; this is intentional, not a fixed wait.
3. During a final in-flight split, repeatedly click visible animals: the adoption counter must remain unchanged and no fresh adoption particles should appear. Already queued litters may still add animals; this is the same wave, not a new wave.
4. Confirm the existing capacity explanation appears once, then its normal continue/automatic flow reaches physics once. Play through the four animals normally.
5. Restart and confirm 45 initial animals, zero adoptions and normal clickable animals, with no stale ending transition.

## Latest pass: fate hold, accelerated breeding, smaller stamp and ending legend

The reveal now adds a separate 2,500ms `fates` hold after the animal-to-symbol crossfade has fully completed. Every symbol stays fully visible, with no skull yet visible; the original skull crossfade follows. Hidden-tab pause uses the same existing clock. Total reveal duration is approximately 10.7 seconds.

Wave-start intervals now decrease from 4,800ms, through 4,032ms and about 3,387ms, to a 3,200ms floor. Later staggered parent windows are bounded by that cadence, replacing the old fixed eight-second target; the actual 1,400ms offspring movement, per-child offsets, sparse-source selection, litter counts, packing and population protections remain intact. Recovery gaps also have a floor. The 72×36 CSS-pixel Adopted stamp is 25% smaller than the previous 96×48 version, with an independently adjusted bold label and centered 36,18 hotspot.

Ending cards reuse `drawExitIcon` for their four inline Canvas icons; no second icon vocabulary was introduced. Added prose distinguishes this work's lack of suitable longitudinal data from an unsupported claim that nobody has ever collected data. Actual physical outcomes and creative whole-screen outcomes remain separate. No online or browser-local leaderboard has been implemented, and no external data service, account or publication setting was changed.

All **38** automated tests passed: the previous regressions, five new breeding tests, and one new full-opacity fate-hold test. Reveal continuity tests include both boundaries of the new hold. The new breeding checks cover monotonic bounded intervals, the original early-wave parent ranges, staggered waves four through six with at least 30 sources when space permits, completed offspring movement before the next wave, adopted-source skipping and restart reset.

```powershell
node --test tests/breeding.test.mjs tests/capacity-notice.test.mjs tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

Chrome, driven with native pointer events and a controlled animation clock, completed both the 45-animal development sample and a normally saturated 479-animal snapshot. The latter was reached after one native adoption in 1,580 controlled frames from restart to physics (including the capacity notice); this is not a real-time FPS measurement or a guaranteed completion time. Both samples completed the real four-animal physics stage, all reveal phases, the final page and native restart. Actual returning-ball relaunch and once-only outlet results were retained.

Browser draw traces confirmed that all fate icons were unchanged at full opacity for more than two controlled seconds, and that hiding the document also paused this hold. The 2,500ms exact boundary is additionally tested in the unit suite. All four ending legend canvases and the new data note were present. Final pages were checked at 1440×900, 390×844, 320×568 and 844×390 for horizontal overflow and scrollable access to restart; desktop/mobile and the full-symbol hold screenshots were visually inspected. Counts summed to the saved snapshot and rounded percentages to 100.0%; no uncaught JavaScript exceptions were observed. Missing-library recovery also passed. A separate capacity check passed all four notice viewports and manual/automatic/pause/reset checks; its subsequent longer browser session encountered a CDP evaluation timeout. The full gameplay check succeeded on a fresh browser run. Physical phones, other browsers, public hosting updates and shared leaderboard behavior remain unverified.

Manual check: refresh the local page with Ctrl+F5, inspect the smaller Adopted stamp on a real mouse, compare early/late breeding cadence, finish four real animal exits, count roughly 2.5 seconds once only fate symbols are visible, then inspect the final icon labels, explanatory prose and restart. The headless captures do not prove operating-system cursor text readability; please check its physical display size on your screen. Publishing still requires committing and pushing this local update.

## Latest pass: capacity explanation between stages one and two

The saturated, settled first stage now enters a separate `capacity` mode before creating the physical world. It freezes the animals and population counters, hides the first-stage HUD, and displays the requested capacity/adoption-speed explanation over the existing animals. After 4,400ms of visible app time it enters physics; a button can continue immediately, and restart cancels the notice. There are no independent timeout callbacks. A new `?stage=capacity` preview uses the same explicitly documented initial 45-animal sample as the existing physics preview; normal visits still begin at START.

All **32** automated tests passed, including three new capacity-state regressions: frozen population/no early physical world; clamped/paused countdown; reset without a stale automatic transition. The renderer adds only a frozen capacity branch, and the physical simulation, breeding, adoption, particles and ending logic are otherwise retained.

Chrome checked the notice at 1440×900, 390×844, 320×568 and 844×390. Both controls remain reachable without horizontal clipping. A hidden-document wait longer than the full notice duration did not advance the countdown or move the animals. Manual continuation creates exactly one world, duplicate continuation cannot create another, automatic continuation works after the configured hold, and native restart removes the notice without a later accidental transition. Screenshots were visually inspected. Publishing has not been performed; README contains GitHub Pages instructions only.

The normal START path also reached a real saturated population of 454 animals, displayed the notice before any new physical animal was loaded, then automatically continued into the four-animal apparatus. The rerun covered real spring launches, returned-ball relaunch, once-only exit pulses, the 45-animal preview's complete ending, the real full-population reveal entry and mid-reveal restart, and missing-library recovery with no uncaught exceptions. This browser harness uses a controlled animation clock, not measured FPS or a human user trial.

Run the current suite:

```powershell
node --test tests/capacity-notice.test.mjs tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

## Previous pass: stage-two fixes, then the simplified ending

Implementation followed the requested order: the top-panel removal, additional decoration sizing and momentary exit feedback were implemented and browser-checked before adding stage three. The physics module, forces, configuration and stage-one animal/breeding/packing/particle modules were not changed.

Run all current tests from the project root:

```powershell
node --test tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

All **29** tests passed. The existing tests now expect a 360ms exit flash, not a permanently closed/lit face, and a 1.35 sizing target (another 12.5% over the previous 1.2 version). The 3,608 decoration constraints still pass; tight screens cap motif size without moving the machine. Seven new tests cover immutable snapshot-to-simulation mapping, exclusion of adopted animals, independent real records, configurable weights/zero categories, percentage rounding to 100.0%, continuous reveal phases, staggered per-item disappearance, empty/single-item edge cases, reset in both new modes, and one short pulse per collection.

Stage-two Chrome checks were completed before stage-three implementation: ten viewports, actual native lever drags, four unique animals including one returned-ball relaunch, full-ball outlet timing, one pulse per result, intermediate flash intensities, no continued flash drawing after expiry, and no upper acrylic-panel rectangle drawing. First-stage adoption, breeding, direct transition, reset and missing-library recovery also passed. Canvas captures were visually inspected for the clean upper baffles and larger motifs. These use a controlled animation clock, not measured real-time FPS or a human user trial.

The ending was then checked in actual Chrome through four real animals. Its 45-animal development sample completed every reveal phase, kept animal positions still, paused while the document was hidden, displayed the exact four requested sentences, and reached a final page whose simulated counts total 45 and displayed percentages total 100.0%. Four actual physical records are labelled separately. The Matter world is empty at the reveal, and native final-page restart clears the cards and returns to 45 animals / 0 adoptions. The final page was checked at 1440×900, 390×844, 320×568 and 844×390, with no horizontal overflow and a reachable restart via vertical scrolling.

A separate normal run adopted one animal, bred to a real saturated snapshot of 482 remaining animals, completed another four real physical animals, and reproduced all 482 static animals at the reveal. Native mid-reveal restart cleared the scene; the old ending did not reappear while the restarted game continued. No uncaught JavaScript exceptions were observed. The development shortcut intentionally retains only its real 45-animal sample, not an artificially inflated full-screen population.

A further normal run with 474 remaining animals completed **the entire** reveal and final-page sequence, not just entry. All 474 positions stayed static; hiding the document paused the reveal; all fade/symbol/skull/disappearance phases rendered; displayed counts totalled 474 and percentages totalled 100.0%. The four real outlet records stayed separate. Desktop/portrait/short-landscape final pages and native ending restart passed. Screenshots in `screenshots/wip3-*.png` show this full-population run. All browser runs use a controlled clock and are not human usability trials or device frame-rate measurements.

Current changed production files: `src/physics-materials.js` (remove upper acrylic and persistent outlet face), `src/physics-feedback.js` (360ms flash), `src/physics-viewport.js` (additional motif growth), `src/physics-renderer.js` (use flash; export the shared exit-symbol drawing), `src/reveal.js` (new simulation, timing and cached symbol rendering), `src/state.js` (new resettable fields), `src/canvas-renderer.js` (reveal branch), `src/main.js` (phase transitions, ending DOM and restart), `index.html` and `src/styles.css` (isolated reveal/ending UI). Tests, README, credits and screenshots were updated. `src/physics-stage.js` and stage-one animal/breeding/packing/particle code retain their pre-edit hashes.

Manual check: start the server as documented in README and refresh with Ctrl+F5. Inspect the top baffles, side-motif clearances and momentary outlet pulse using `?stage=physics`; finish four unique animals and allow any returned animal to be relaunched. After the last pulse, watch the approximately eight-second reveal and check all four final counts/percentages, the simulation disclaimer, separate real records, vertical scrolling and restart. Use normal START rather than the 45-animal shortcut to inspect the crowded reveal. Restart once during the reveal as well.

Known limits: basic crossfades rather than final motion polish; no sound; simulation weights are illustrative equal weights, not data; physical phones, other browsers and device FPS remain unverified. The final page explicitly says that continuing breeding is not death and that skulls are a visual metaphor.

## Earlier WIP 2 records (historical)

The entries below record earlier implementation passes. Their persistent shutter, 20%-growth-only and no-ending descriptions have been superseded by the current behavior above.

## Automated physics checks

From the project root, with Node.js installed:

```powershell
node --test tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs
```

The tests import the actual local Matter.js 0.20.0 build and production physics module. They do not replace collision calculations with scripted paths. The eight sensor fixtures deliberately position bodies in known lanes to test detection, not to demonstrate a production route. Each pair of adjacent lanes maps to one of four outcomes.

The twenty-two test cases cover:

1. Taps, pulls below the threshold, clamped maximum travel and cancelled pulls.
2. Every half-unit pull distance from 120 to 240 (241 samples): increasing first-launch speed, gravity before piston contact, actual piston/obstacle collisions and a real exit. When a ball naturally returns, the test user operates the lever again, cycling 180 / 240 / 156 / 210 pull depths, up to eight attempts; production never auto-relaunches. The sweep must reach all four outlets, without assigning an outlet in advance.
3. Four unique animals, including extra lever releases after returns: unique records, zero-count outlets, no fifth animal and no remaining animal body after completion.
4. Detection of all eight lanes only after the entire rendered circle and physical bounds clear the existing line. Centre-only crossings produce no record or shutter; full crossings produce exactly one of each. Duplicate events do not add records.
5. Completion at simulated 30, 60 and 144 Hz render update rates, using the same fixed physics step.
6. Out-of-bounds and stalled-shot errors without fabricated outcomes.
7. Snapshot isolation, exclusion of an adopted animal, physics retry, and full restart clearing bodies, event listeners and records.
8. A readable error when the physics library is missing.
9. The enlarged 48-unit animal has at least its full diameter plus six units of gap between each pin and baffle. Control travel and actual spring compression use separate, bounded scales.
10. A portrait board with six rows of 27 staggered pins, approximately 68.6-unit clear lane widths, and clearance between pins and between pins and side walls.
11. Six decorative cover sprites drawn at half opacity, outside the board, without creating bodies; small vertical floating movement and no floating with reduced motion enabled. The draw-call trace is not a pixel-level rendering test.
12. The fixed metal surface cache is reused between frames, and is regenerated when the raster scale changes. Rendering does not mutate physical positions, velocities, shapes, materials or filters.
13. Uniform 774:932 scaling, complete apparatus/handle containment, and pointer coordinate round trips across eight representative sizes, from 320×568 to 2560×1440.
14. A grid of 902 intermediate window sizes (320–1920 wide, 360–1200 high) keeps all six decorative motifs and their floating amplitude outside the machine and header. Borderline aspect ratios reserve small motif rows instead of overlapping controls.
15. The main field is 613 units wide and the entire launch well is 58 units wide, bounded directly by the moved partition and outer casing. There are no inner launch rails or side clamps. The 54-unit piston fits within the casing; a rear travel stop retains the y=904 stop plane and is collision-filtered to the piston only. Pins, baffles and outlet geometry expand with the main field.
16. Four controlled visits to the same outlet produce four results and four shutter events without extra colliders or forced diversity. Closure is monotonic over 280ms, remains closed, retains its backing during repeated visits, and resets on disposal. These sensor fixtures do not demonstrate natural trajectories.

17. No gate body exists. A controlled above-partition fixture travels through the real entrance in both directions while retaining the permanent partition and roof deflector.
18. A 156-unit pull naturally returns with the open entrance. The same dynamic body can wait over 30 simulated seconds, then relaunch via another piston collision without changing its position, velocity, angle, identity or unique-animal count at release. No outcome or closure is recorded merely for returning.
19. Cancelling a returned-ball pull parks the piston at its current position instead of snapping it through the ball; the ball remains dynamic and a later valid release works.
20. The fourth animal can return and relaunch even when the unique-animal launch counter is already 4; only its actual outlet crossing completes the round.
21. At spacious desktop sizes, motifs grow by exactly 20%, have staggered horizontal positions and unequal vertical gaps, and are not mirrored. Repeated layout calls produce identical positions, not random jumps.
22. Across 3,608 combinations of window dimensions (320–1920 by 360–1200) and header heights (80 / 100 / 140 / 180), all six full floating envelopes, including the 1.3px outline, retain at least 12px pair clearance and avoid the header, viewport margins and full machine/handle bounds.

## Larger, staggered decorative animals (latest visual change)

Only production file `src/physics-viewport.js` changed for this pass. The existing apparatus fit, presentation scale, pointer transform, renderer, physics, lever, exits, header, SVG artwork, opacity and floating animation are unchanged. A SHA-256 comparison of all non-decoration viewport fields across the existing 902-size grid matches the pre-edit baseline (`fb1fb22e49a2cf26ae53c27c2fae1c04925504b0473d4313864d345004794c33`). The physics/config/main/materials/feedback/styles/HTML file hashes also match their pre-edit values.

The target diameter is the old diameter multiplied by 1.2. Each side has its own safe rectangle and stable variation seed. Free space is divided into unequal end margins and unequal gaps, with alternating small lateral offsets; both groups retain the same circle diameter. Floating envelopes and a 12px minimum gap are reserved before adding offsets. On tight screens only the decoration diameter is capped, and the existing upper/lower motif bands are reused; the central apparatus is never resized or repositioned to accommodate the enlarged motifs.

All 22 automated tests passed. Actual Chrome layout checks passed at 1440×900, 1920×1080, 1024×768 (DPR 2), 768×1024, 390×844, 320×568, 844×390, 768×880, 640×768 and 390×480. Native Canvas draw tracing confirmed motif diameter, separation and clearance from the actual header, viewport and machine/handle at two different floating phases per size. Each size still accepted a native 75% pull cancelled without firing, with the ball/renderer aligned. Desktop and portrait screenshots were visually inspected and refreshed. This pass did not repeat the earlier full browser four-animal/relaunch session; the unchanged physics is covered by the rerun automated regressions and file-hash comparison. Physical phones and other browsers remain unverified.

## Open entrance and same-ball relaunch (previous functional change)

All twenty then-existing tests passed on Node.js 24 after the open-entrance change. The stage-one animal/breeding/packing/particle modules were not edited in that change. Gravity, spring force, masses, restitution, pull range and four-animal limit are unchanged. Outlet category mapping, full-ball clearance rules and outlet shutters are preserved. The 241-sample force sweep passes with user relaunches when needed and still reaches all four outlets. These fixed-input results test reachability, not real-world probabilities or a promise of four different outcomes per round.

The upper gate body and its dedicated drawing function have both been removed. The lower partition, outer casing, roof deflector, piston and piston-only stop remain. A returning ball stays dynamic; once it settles on the piston, only the piston is parked and the handle is rearmed. While waiting or pulling again, Matter.js still integrates the ball. A valid release un-parks the piston; no ball position/velocity reset or new body is used. Returning/cancelled-pull waiting does not consume the 30-second flight timeout.

The standalone 241-input sweep observed 34 natural first-flight returns. With explicit test-user lever inputs after a return, all samples reached a real outlet, with at most two relaunches and no boundary or timeout errors. Final outlet counts were 50 / 49 / 53 / 89. First-launch speed still spans approximately 26.44–53.05. These counts include the documented repeat inputs and are not first-launch outcome frequencies.

The updated headless Chrome check used native pointer drag/release on the actual page. The second animal naturally returned after its 156-unit first pull. It waited over 30 simulated seconds with no result or closure recorded; the next lever release relaunched the same Matter body (ID 54) with progress unchanged at 2/4. Four unique animals completed with five releases in total, actual outlet indices 1 / 1 / 1 / 2, one closure each, and no fifth animal. Ten viewport sizes, in-motion resize, 390px portrait firing, retry/reset, stage-one adoption/breeding/direct transition and missing-library recovery passed with no uncaught JavaScript exceptions. The controlled animation clock is not a human trial or a performance benchmark. Screenshots `wip2-returned.png` and `wip2-relaunched.png` record the returned/relaunched states.

Earlier results below describe their corresponding previous implementation; in particular, the old automatic entrance gate and four-total-release assumption have been superseded. The current limit is four unique animals, not four total lever releases.

## Actual browser checks performed

Chrome headless was exercised through the DevTools protocol with native browser mouse events. A controlled `requestAnimationFrame` clock accelerated the experience; this is **not** a human user trial or a real-time performance benchmark.

Verified:

- The actual page loads, draws a 48-unit animal and accepts pointer-captured handle dragging/release. The control now uses a light grey-beige bed and small dark-gold markings rather than a large yellow area; 50%–100% remains the valid firing interval.
- The portrait board, 27 pins, eight bottom lanes and six large side animals were visually inspected in the captured page. Browser draw tracing confirms the decorations have 50% opacity, move gently, and stop floating with the reduced-motion preference.
- A below-threshold pull spends no shot. Four native pointer drag/release sequences complete; repeated input while a shot is in motion and after the fourth shot does not create a fifth animal.
- Outlet results are observed, not hard-coded force-to-outlet mappings; fractional pointer conversion and the revised geometry can change a collision sequence, and repeated outcomes remain valid.
- Resizing during a drag cancels it without firing.
- Drawn animal center and radius agree with the actual Matter body after viewport changes, including device pixel ratio 2 and a 390×844 portrait viewport.
- Physics retry clears the old world and starts at 0/4; full restart clears old worlds and returns to 45 animals and zero adoptions.
- First-stage adoption changes 45 to 44 with one adoption; reproduction continues; a normally filled first stage directly enters physics, without an explanatory placeholder.
- Blocking the local Matter.js request produces a readable error and still allows restarting the first stage.
- No uncaught JavaScript exceptions occurred in this browser check.

## Whole-device left/right repartition

The outside frame stays 774×932. The partition moves right by 53 units, expanding the main field from 560 to 613 while narrowing the entire launcher from 111 to 58. The old extra guide rails are removed, not merely hidden. The main-field share of the two clear regions grows from about 83.5% to 91.4%.

The production pin and baffle coordinates are expanded across the actual main-field width, and all eight outlet sensors/dividers are regenerated across that width. The launch centre moves to x=1298 and the roof deflector is derived from the revised field edge and right casing. A 54-unit piston fits the 58-unit well; a single flush rear-plane carriage stop maintains the original impulse timing without adding side clamps. Its collision filter accepts the piston and excludes the animal; the animal continues to collide with the real partition, outer casing, piston and main-field obstacles.

A standalone sweep of 241 half-unit pull depths reached the four outlets 46 / 45 / 60 / 90 times, with no stalls or boundary errors. Minimum and maximum pre-field launch speeds remained approximately 26.44 and 53.05, matching the prior spring setup. This is a finite input test, not equal-probability balancing.

The updated Chrome run completed four native-pointer shots with actual outlet indices 1 / 2 / 1 / 2 (lanes 3 / 4 / 2 / 5), with no fifth shot or duplicate result. Ten window sizes, in-motion resize, full-clearance/closing timing, retry, stage-one adoption/breeding/direct transition and missing-library recovery also passed. The repeated browser outcomes were retained as real results; the wider force sweep separately establishes four-outlet reachability.

Files changed for this repartition: `src/config.js`, `src/physics-stage.js`, `src/physics-materials.js`, the geometry regression in `tests/physics-stage.test.mjs`, `README.md`, this record and preview/keyframe screenshots. The responsive transform, stage-one logic, outlet feedback module and final-page scope are unchanged.

## Previous local palette / shutter pass

The six stage-two palette references are isolated in `PHYSICS_PALETTE`; the stage-one palette is unchanged. Metal highlight contrast was reduced. The subsequent whole-device repartition above replaces the interim inner-rail design. No shutter body is added to the physical world.

The browser harness observes actual result/closure events and real Canvas draw calls without selecting routes. For each of four native-pointer shots it checks that the trailing edge is below the unchanged outlet line when recorded and that the ball has already been removed from the world when a closure event is queued. The first closure is stepped frame by frame, captures start/middle/closed screenshots, checks multiple intermediate sliding positions, then confirms that the closed face stays put. Repeated visits to the same outlet are additionally checked in the controlled unit fixture; the already-closed backing is not instantly reopened.

The plate is a visual front-face collection indicator, not a gate that blocks future balls. Its timing uses the existing stage clock, so hidden-tab pause and retry/reset do not leave independent timers behind.

Files for this local pass: `src/config.js`, `src/physics-stage.js`, `src/physics-feedback.js` (new), `src/physics-renderer.js`, `src/physics-materials.js`, stage-two hints in `src/main.js` / `index.html` / `src/styles.css`, `tests/physics-stage.test.mjs`, the Canvas trace stub in `tests/physics-renderer.test.mjs`, this record, `README.md`, and refreshed preview/keyframe screenshots. Responsive layout, first-stage behavior and final-page scope are unchanged.

## Responsive/material pass

The actual Chrome page was checked at 1440×900, 1920×1080, 1024×768 (DPR 2), 768×1024, 390×844, 320×568 and 844×390. Additional borderline layouts were checked at 768×880, 640×768 and 390×480. Each layout preserves the board ratio, keeps its bottom outlets and full handle travel inside the viewport below the header, and accepts a 75% native mouse drag without spending a shot when cancelled. At 1440×900 the board measures approximately 636×766 CSS pixels; at 1920×1080 it measures 780×939. Narrow portrait windows are width-limited rather than stretched.

Captured desktop and portrait pages were visually inspected for subdued warm-grey metal, graphite faces, silver pin/ball rims, transparent acrylic edges, recessed outlets and unchanged flat side animals. The materials are Canvas shading, not a new 3D or physics system. Static surface caching is unit-tested, not claimed as a measured frame-rate improvement.

An extra native-pointer shot at simulated 390×844 completed after resizing its moving ball to 320×568 at DPR 2. The resize did not alter the body's world position before the next physics step, and rendered alignment held throughout the remaining flight. This is not a physical touchscreen trial.

The local PowerShell server was given an EOF/receive-timeout guard because cancelled browser connections could otherwise block module loading. Connection-close and idle-preconnection recovery were checked with real local sockets, and the full browser check was repeated using this server. This does not change the game. No additional library or installation is required.

### Files changed by this visual pass

- `src/physics-viewport.js` (new): presentation-only uniform fit, safe bounds, background layout and pointer mapping.
- `src/physics-materials.js` (new): cached static metal/acrylic surface and dynamic ball, spring, handle and outlet materials.
- `src/canvas-renderer.js`: separate stage-two presentation transform, header measurement and matching input inverse.
- `src/physics-renderer.js`: material integration and independently placed flat background sprites.
- `src/styles.css`: responsive header spacing; no whole-game CSS transform.
- `src/main.js`: passes the existing header into the renderer; physics input/launch rules are untouched.
- `serve.ps1`: recover from disconnected or idle local browser connections.
- `tests/physics-renderer.test.mjs`, `tests/physics-viewport.test.mjs` (new), this test record, `README.md` and preview screenshots.

## Manual verification steps

1. Run `powershell -ExecutionPolicy Bypass -File .\serve.ps1` and open `http://localhost:8000`.
2. Try adoption and wait for the screen to fill. Check that the transition goes directly to the apparatus.
3. Alternatively use `http://localhost:8000/?stage=physics` for a documented test sample without waiting.
   Check the upright central board, six pin rows, eight physical lanes and four abstract group icons. Side motifs should float quietly and should not react to adoption clicks.
4. Pull in the upper half and release: no shot. Pull past the middle gold mark and release anywhere in the lower half: the handle rebounds and one animal launches through the narrow well formed by the partition and casing, with no inner track. Compare different valid pull depths rather than always dragging to the bottom stop.
5. While it moves, try another drag: no second animal should appear. If it naturally returns down the open entrance, wait for the returned-ball hint, pull again and check that the same animal launches while progress stays unchanged. Waiting more than 30 seconds at the ready piston must not produce an error. The entire ball must pass the outlet line before the front plate slides closed. Repeat until all four animals have passed real outlets. Repeated outlet results are valid; no collider closes the physical path.
6. Check that the fourth completion disables further launches and shows only a neutral completion message, not fate names or final statistics.
7. Start dragging, resize the window and release: no accidental launch. Resize while an animal moves: it should remain aligned with the apparatus.
8. Use “重新体验”, then “重新开始”: old animals/results must not persist. Temporarily blocking the vendor file in browser devtools should show a recoverable initialization error; restore it and reload before continuing.

## Not verified

Physical touchscreen ergonomics, Safari/Firefox behavior, prolonged sessions and frame rates on other machines have not been tested. The portrait layout is geometrically aligned but width-limited and small; it deliberately retains spare vertical space instead of stretching the board or cropping the launcher. The finite force sweep does not prove that all possible fractional inputs or browser conditions are stall-free; a 30-second in-flight timeout or boundary failure is reported honestly and offers a retry. Returned-ball waiting is excluded from that timeout.
