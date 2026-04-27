# 1. 项目定位

**After Dark: How the Same Journey Changes 夜幕后：同一段出行如何改变**

这不是一个“夜晚危险地图”，也不是一个试图测量“真实恐惧”或“真实危险”的工具。它是一个面向夜间公共交通使用者的、解释型且辅助权衡的路线比较原型。

它关注的是：同一起点与终点，在不同出发时间下，路线如何在等待、可达性、支持设施、活跃度与暴露条件上发生变化；同时，它帮助用户根据自己的情境与优先级，比较这些变化意味着什么。

**它要回答的不是：**

- 哪里危险
- 哪条路线最安全
- 哪一个时间一定最好

**而是：**

- 为什么同一段路到了夜晚会更难等
- 为什么同一段路会变得更少支持
- 为什么同一段路会变得更不确定、更暴露
- 不同出发时间分别意味着什么样的代价与体验
- 为什么不同用户可能会对同一条路线做出不同选择

这个改法非常重要，因为这正好回应老师那句最关键的话：不要替用户下结论，要帮助用户做权衡。

# 2. 研究问题

### 主问题

How does the same journey change across time of day in terms of waiting, support, activity, exposure and recovery — and how can those differences be made comparable rather than reduced to a single answer?

同一段出行在不同时间段，如何在等待、支持、活跃度、暴露与恢复能力上发生变化；以及这些差异如何被设计成可比较的，而不是被压缩成单一答案？

### 子问题

#### 子问题 1：体验差异

**同一起点终点，在白天与夜晚，是否会出现：**

- 更长等待
- 更多换乘
- 更长步行
- 更少 support
- 更弱恢复能力
- 更少备选路径

#### 子问题 2：支持结构

**夜晚的主要变化是否不只是“危险本身”，而是：**

- 服务变稀疏
- 设施关闭
- 活跃度下降
- 暴露增加
- 出错代价上升

#### 子问题 3：设计问题

**面对这些差异，一个原型应该如何呈现：**

- 不同时间选项之间的 trade-offs
- 不同用户可能的优先级差异
- 系统无法替用户决定的部分

#### 子问题 4：公平问题

哪些用户与哪些区域在夜晚更容易失去高支持的公共交通体验？

# 3. 故事主线

要从“三层叙事”改成“比较 + 权衡 + 反思”

#### 第一层：The Same Journey Becomes a Different City at Night

同一条路到了夜晚，像进入另一座城市。

**结尾最好加一句：**

> The point is not to declare one option right or wrong, but to show how the same journey asks different things of the traveller after dark.

重点不是宣布哪个选项对或错，而是展示同一段出行在夜晚会向乘客提出不同要求。

#### 第二层：Who Loses Mobility After Dark?

谁在夜晚失去行动自由？

**不要写成“谁最脆弱”，而是写成：**

- 晚归学生
- 预算有限的公共交通使用者
- 夜班工作者
- 对系统不熟悉的人

**更容易在夜间承受更高的：**

- waiting burden
- uncertainty
- support loss
- recovery difficulty

#### 第三层：Not Just Safety, but Trade-offs in Thinner Support

问题不只是安全，而是在夜间支持系统变薄时，不同选择各自意味着什么样的代价。

这一层非常关键，因为它把网站从“判断器”改成了“比较器”。

**所以这层建议正式写成：**

最终呈现的不是一个 danger score，而是一组可比较的 trade-offs：

- waiting burden
- service uncertainty
- support loss
- activity decline
- exposure context
- lighting infrastructure proxy

### 用户与使用目的也要改得更明确

用户设定是对的，但“使用目的”必须从“知道哪条更适合”改成“帮助形成自己的判断”。

### 使用目的

这个 prototype 不是替代 Citymapper 或 Google Maps。它也不是为了生成一个 definitive answer。

**它的价值在于：**

- 揭示“最快路线”之外的隐藏代价
- 帮助用户比较不同时间选项下的条件变化
- 让用户根据自己当晚的优先级做判断
- 为课堂讨论提供一个带有批判性边界意识的设计原型

**它帮助用户看见：**

- 这条路线是否只是“时间上可行”，但等待很重
- 这条路线夜间是否 support 很薄
- 这条路线是否更 quiet，但也更少“有人感”
- 这条路线是否在错过一班车后很难恢复

它不是决定器，而是 decision-support prototype。

这句最好直接出现在 landing page 或 reflection page。

# 4. 数据和指标体系

### 五大模块：

- Functional Travel
- Waiting and Service Uncertainty
- Support Access
- Activity and Exposure Proxies
- Lighting Proxy

这些指标不能再被组织成一个“总分”或“推荐结论”。

### 结果表达方式

这版项目的输出不是总分，也不是推荐标签。它更适合用分解式 comparison cards 或 trade-off panels 来表达。

**建议固定为六张比较卡：**

- Functional cost
- Waiting burden
- Service uncertainty
- Support access
- Activity context
- Lighting proxy

每个时间选项都显示这六类结果，但不合成为一个 single score。

### 为什么不做总分

**因为：**

- Police 数据位置近似
- OSM 覆盖度存在差异
- lighting 只是 proxy
- service uncertainty 不是严格 delay probability
- 不同用户会对同一组条件给出不同权重

因此更合适的不是“客观排名”，而是“帮助比较”。

这个改动会非常符合老师的反馈。

# 5. 网页结构和流程设计

## Page 0 — 封面

### 需要有好看的设计，内容需要包括：

- 一点好看的动画：可以做一点电影感的特效。例如白天到夜晚的背景渐变/地图线条发光模拟灯光亮起/页面从左到右是从白天到晚上等等。

可以是背景的风格化地图动态变化，参考红酒：

![](after_dark_markdown_assets/image1.png)

或者是将标题和问句加一个好看的入场效果，参考睡眠：

![](after_dark_markdown_assets/image2.png)

或者加一两句主题句，参考蒲公英：

![](after_dark_markdown_assets/image3.png)

- 一个显眼的标题+一个问句，字不要太多，需要明确表现本研究的问题，让使用者意识到这个项目针对的是什么问题，并且知道这个项目准备如何帮助人。
- 一个按钮或者滚动条，引导用户点击进入，或者往下滑

## Page 1 — 问题和需求描述

### 结合动画，展示典型场景，最好是具体到谁+做什么+怎么样：

例如，未成年+夜间出行+担心安全

#### Tonight I am…

- travelling alone 独自出行
- returning late 很晚出门
- carrying bags 拿了行李？
- unfamiliar with the area 不熟悉地点

**然后给出需求：**

#### I need…

- 更少的步行路程，因为我觉得一个人走夜路很危险
- 减少在公交站台的等待时间，因为feeling unsafe
- 希望步行的路线有充足的灯光，或者有营业中的店铺

## Page 2 — 伦敦现状大描述

主要展示的内容：针对全伦敦或者对于指定的伦敦区域（而不是具体的路线或者路段）展示：

白天vs夜间的灯光变化

白天vs夜间的公交、地铁线路和站点数量

白天vs夜间的公交平均等待时间

引入该页面，可能可以做一个同一街区在白天到晚上的外观对比or变化。

### 可能的可视化元素：

#### 日夜切换动画

**时间从 Day 切到 Night 时：**

路网亮度变暗

support 点减少

activity layer 稀疏

这个动画会非常直观。

## Page 3 — 同一OD不同时间的对比

这里不应该是单纯地图，而应该是双栏或三栏比较界面。

**例如：**

Daytime

Evening

Late Night

同一起点终点，两个或三个时间并排展示。

**让用户一眼看出来：**

路线不是简单变慢，而是整个支持结构、恢复能力、暴露感都变了。

#### 路线的选择：

（1）预设4个起点-终点线路，分别代表四类 persona cards：

晚归学生

预算有限的公共交通使用者

夜班工作者

对系统不熟悉的人

（2）同时也需要放两个输入框，用户自己写起点终点

### 页面内容建议

#### 上半部分：

- 并列路线地图
- 每条路线的 path、步行段、换乘节点、等候节点可视化
- 可以在地图上强调：
- long waiting points
- transfer points
- fewer backup options
- lower support density
- 错过某班车之后，最长的等待时间

#### “错过一班车之后”模拟

这是你项目里很强的点：recovery difficulty。

可以在某个路线节点加一个小交互： What if you miss this connection?

**然后马上显示：**

next service in X min

backup routes fewer

support nearby thinner

这个小功能特别能体现“夜晚不只是更慢，而是更难恢复”。

#### 下半部分：

- 六张 comparison cards，固定展示：
- Functional cost
- Waiting burden
- Service uncertainty
- Support access
- Activity context
- Lighting proxy

注意这里最好不是打分条，也不是“优/良/差”。而是用相对比较的视觉语言，比如：

- longer / shorter
- denser / thinner
- more recoverable / less recoverable
- more active / quieter
- better lit / less lit

### 最适合的交互方式

**点击某一条路线后：**

- 地图高亮这一条
- 右侧展开细节解释
- 用户能看到“为什么这一段变糟了”

**例如：**

- 不是“更危险”
- 而是“错过这班车后，下一个可恢复选项更少”
- “support places around the waiting segment become thinner”
- “walking segment becomes longer relative to public transport segment”

这会让你的分析更像设计解释，而不是道德判断。

### 可添加的可视化元素：

#### Journey timeline

非常值得加。

**地图之外，你需要一个横向时间轴，把路线拆成段落：**

walk to stop

wait

ride

transfer

wait again

final walk

然后对比 Day / Night 的时间轴长度与性质。

这会让用户更容易看懂： 不是总时长变了而已，而是哪一段变重了。

### 可能添加的可视化元素：

#### Persona switch

这是非常漂亮也非常有设计感的元素。

**页面上放四个 persona 标签，切换后：**

卡片解释语气变化

某些维度高亮

背景、颜色等发生变化

对同一路线的“关注点”发生变化

这会让网站一下子从“静态信息展示”变成“面向用户判断的原型”。

## Page 4 — What Changes After Dark page：变化来自什么

这一页相当于“机制拆解页”。

前一页告诉用户“变了”，这一页告诉用户“为什么变”。

你 proposal 里已经有非常好的五大模块，这一页可以专门把它们做成一个解释性面板：

- Functional Travel
- Waiting and Service Uncertainty
- Support Access
- Activity and Exposure Proxies
- Lighting Proxy

#### 这一页的页面形式

不要用太学术的论文式排版。更适合做成一个scroll-driven explanation：

**用户向下滚动时，每滚到一个模块，左侧出现：**

- 一个简洁图解
- 一个小地图或局部网络图
- 一个日/夜对比小动画

**右侧出现：**

- 这个指标在表达什么
- 它不表达什么
- 为什么它不能被简单合成成“危险分数”

**例如对 Lighting proxy：**

- 它表达的是环境照明条件的近似支持信息
- 它不是“绝对安全性”
- 它只是帮助理解为什么同样一段步行在夜晚会更难被感知为轻松

这一页非常适合体现你的“批判性边界意识”。

#### 很重要的一点

每个模块最好都加一句：This is a proxy, not a verdict.或者中文版：这是近似解释，不是最终判断。

这样网站的学术态度会非常成熟。

### 可能的可视化元素：

#### Trade-off cards卡片

你 proposal 已经定了六张卡，这非常对。

**每张卡可以这样设计：**

标题

一个简洁指标图

一句解释

一句 caution / not-a-verdict

**比如： Waiting Burden**

Longer and less recoverable waiting after dark.

Missing one service creates a bigger penalty.

This does not measure actual delay probability directly.

这种写法很成熟。

## Page 5 — City-wide Fairness page：谁在夜晚更容易失去高支持出行

这是从单条路线扩展到城市尺度的页面。

前面几页解决“同一路线如何变化”；

这一页解决“这种变化是否在空间上不均匀”。

### 这页建议回答的问题

哪些区域在夜晚更容易出现指标相对白天的巨大下降。注意比较的并不是晚上出行的指标，而是晚上相对白天的下降/落差情况，可以包括：

support thinning

weaker service continuity

fewer recovery options

lower activity context

longer waiting burden

### 页面形式建议

这页用地图为主，但不是传统 choropleth 一张结束。

**更适合：**

一张主地图，显示“night support thinning”或“late-night mobility loss pattern”

**旁边一个切换器：**

waiting burden

support access loss

recovery difficulty

activity decline

lighting proxy gap

#### 下面放 small multiples

比如白天 vs 夜晚 / 内城 vs 外围 / 不同区域类型对比

### 最好讲清楚的叙事

不是说： “这些地方更危险。”

而是说： “这些地方在夜晚更容易失去高支持、可恢复、可理解的公共交通体验。”

这句话非常重要，因为它把“公平问题”定义成mobility support inequality，而不是道德化的“安全标签”。

## Page 6 — What to do: Choose Your Route And Time Carefully：谨慎选择出行路线和时间

#### 做四类 persona cards：

晚归学生

预算有限的公共交通使用者

夜班工作者

对系统不熟悉的人

用户点击不同 persona，整个页面的解释逻辑会发生变化。

**例如同一条路线：**

晚归学生更在意 waiting + someone-around feeling

预算有限用户更在意 fare penalty + missed connection recovery

夜班工作者更在意 service reliability + late-hour continuity

unfamiliar traveller 更在意 transfer complexity + error recovery

#### 这一页最适合的设计

不是“系统替用户选路”，而是显示： same route, different burden profile

**你可以用一个很漂亮的方式做：**

中间是一条相同路线

左右两边切换不同 persona

下方六张 trade-off cards 的强调权重发生变化

但页面依然不输出“best route”

这会非常贴合你的核心理念。

#### 这一页的价值

它把“公平问题”从区域层面的不平等，先落到“谁在夜间更容易承受额外代价”。

这比只做一张地图更有故事。

也可以做一个每天逐小时（或每两个小时）的出行对比，可能是以折线图或者类似的形式。主要是为了说明：What changes most across time?跨时间变化最大的是什么？

**从而给用户的直观感觉例如：**

Waiting increases most after 21:00<br>21:00 之后等待增幅最明显

Nearby support drops sharply later in the evening<br>晚一些时段周边支持会明显减少

Later departures are easier to miss and harder to recover from<br>更晚出发时更容易“一错过就很难补救”

**核心说明：**

A faster route is not always a lighter journey.<br>更快的路线，不一定意味着更轻松的出行。

## Page 7 — Reflection / Design Limits page：系统不能替你决定

这一页非常加分，尤其是老师会喜欢。

因为你的项目本来就强调边界意识，所以最后必须有一页把这件事说透。

### 这页要表达什么

### 为什么不做总分

为什么不做“推荐路线”

为什么 proxy 不等于 reality

为什么不同用户会有不同权重

为什么这个原型的价值在于帮助比较，而不是下结论

### 页面呈现方式

可以做成一个非常干净、偏 editorial 的页面。

少地图，多文字，但文字要短、像展览说明。

**例如几个模块：**

What this tool shows

What it cannot know

Why trade-offs should remain visible

Why design should support judgement, not replace it

这一页也可以放方法来源、数据来源、局限性说明。

这会让整个项目从“好看的网站”变成一个真正有学术思考的设计作品。

#### 反思模块 1：What this prototype helps with

**模块标题**

What this prototype helps with<br>这个原型能帮助什么

**条目文案**

Making hidden journey burdens visible<br>让隐藏的出行负担变得可见

Comparing trade-offs across departure times<br>比较不同出发时间之间的权衡

Showing where urban support thins out after dark<br>展示城市支持如何在夜晚变薄

Questioning what journey planners usually optimise for<br>反思传统 journey planner 通常在优化什么

#### 反思模块 2：What it cannot know

**模块标题**

What it cannot know<br>它无法知道什么

**条目文案**

It does not measure fear directly.<br>它不能直接测量恐惧。

It does not prove that one route is “safe”.<br>它不能证明某条路线“安全”。

It cannot represent every traveller equally.<br>它无法同等代表所有乘客。

It cannot replace local judgement or lived experience.<br>它不能替代地方判断与真实经验。

#### 反思模块 3：Method and limits

**模块标题**

Method and limits<br>方法与边界

**固定说明句**

Lighting is a proxy for lighting infrastructure presence, not measured brightness.<br>照明仅代表照明基础设施的存在，不代表真实亮度。

Service uncertainty is inferred from timetables, arrivals and status feeds, not a true delay or cancellation probability.<br>服务不确定性来自时刻表、到站信息与状态数据推断，不代表真实延误或取消概率。

Crime data is approximate and used only as contextual exposure information.<br>犯罪数据位置是近似的，仅作为暴露情境参考。

#### 反思模块 4：If this prototype gets it wrong

**模块标题**

If this prototype gets it wrong<br>如果这个原型判断失准，会发生什么

**条目文案**

Users may read “more suitable” as “safe”.<br>用户可能会把“更适合”误读成“安全”。

Support proxies may overstate or understate lived experience.<br>支持类代理指标可能高估或低估真实体验。

Some user groups may be better represented than others.<br>有些用户群体可能比另一些群体更容易被代表。

Individual comparison tools can never replace structural change.<br>个体比较工具永远不能替代结构性改变。

#### 反思模块 5：If there were more time

**模块标题**

If there were more time<br>如果有更多时间

**条目文案**

Run user testing with different night-time travellers<br>与不同类型的夜间出行者进行用户测试

Add richer local support and accessibility data<br>加入更丰富的本地支持设施与无障碍数据

Compare more route types and borough conditions<br>比较更多路线类型与 borough 条件

Explore how different users weigh the same journey differently<br>进一步研究不同用户如何对同一段路赋予不同权重

### 反思页面结尾文案

The goal is not to declare the city safe or unsafe. It is to show how support, waiting, and recovery change after dark — and why that matters.<br>目标不是宣布这座城市安全或不安全，而是展示支持、等待与恢复能力如何在夜晚发生变化，以及为什么这件事重要。

## Page 8 — 结尾页

美好祝愿：build a better city xxxx

感谢观看！

作者信息

一个按钮：回到首页

### Page整体设计风格：

### 版式

版式上要尽量留白，不要堆太多面板。

这个项目最怕的是“指标太多，看起来像 dashboard”。

它应该更像 story + analytical prototype，不是纯运营后台。

### 配色

不建议饱和度太高太鲜艳，尤其要避免用大面积的红色表示危险、绿色表示安全。需要能传达“夜晚支持变薄”，而不是做一个“恐怖地图”。

### 标题句

每一页都可以用这种非常短、像展览标签一样的句子做章节标题。

**例如：**

Same path, different demands.

- 在图表或数据旁边，放一个抽屉图标/小i图标，显示数据来源/proxy定义等。

### 需要注意避免的：

不要出现安全评分/危险排行/路线推荐排序等类似意思。

不要渲染营造危险气氛。


# 6. 数据集获取及使用

## 先搭一个“全站共用数据底座”

这一层不属于单独某一页，但几乎所有页面都会复用。

### 交通主干数据

- **TfL Unified API**：journey planning、status、disruptions、arrival/departure predictions、timetables、routes and lines、facilities、fares。
- **TfL station topology / step-free & toilet data / live lift disruption**：站内厕所、无障碍、电梯等。
- **TfL network demand / station footfall**：Tube 和 rail 站点客流。
- **TfL buses performance / Underground performance**：EWT、Lost Customer Hours、Excess Journey Time 等。
- **NaPTAN**：公交站、地铁站、铁路站等全国 stop points。

如果研究范围只做 Greater London，**TfL 已经足够做核心交通层**；BODS 主要在你要扩展到 TfL 边界外的英格兰公交时才更有必要。

### Support 与营业状态数据

- **OSM POI + `opening_hours=*`**：便利店、超市、咖啡店、餐饮、药店、公厕、医院周边设施、24/7 场所。
- **OSM `lit=*`**：是否有照明。
- **NHS Find a Pharmacy / EPS DoS API**：开放药店与营业时间。
- **NHS Directory of Healthcare Services API**：医院、NHS 组织与医疗服务查询。
- **BHF / The Circuit AED dataset**：location、availability、access type。
- **TfL public toilets / station toilets**：车站厕所与可达性信息。
- **GLA public toilets dataset**：可作为补充，但这个数据集很旧，只适合做背景参考，不适合当实时 truth。

### 活动强弱、照明、公平背景数据

- **GLA Night Time Observatory / London’s Night Time Economy by Borough and MSOA**：夜间经济活跃度、夜间就业/工作场所等区域 proxy。
- **GLA HSDS mobility / BT footfall**：很强，但订阅制，不适合当你唯一依赖的公开源。
- **NASA Black Marble**：daily / monthly / yearly nighttime lights，适合城市尺度背景照明，不适合街段真实亮度。
- **Census 2021 / Nomis、IMD、GLA boundaries、PTAL grid**：公平分析的区域层。
- **Police API**：只能做 context，不做评分真值。

---

## Page 0 — 封面

### 1. 需要哪些数据集、哪些字段

这一页**不需要硬性数据**。最稳的做法是把它做成“数据驱动的氛围页”，而不是信息页。
可选地复用：

- **Greater London boundary / borough boundary**：`geometry`
- **TfL routes / lines**：`line_id`, `mode`, `route_geometry`
- **NaPTAN / TfL stop points**：`stop_id`, `name`, `lat/lon`
- **NASA Black Marble**：`radiance`
- **OSM lit/open-late POIs**：`geometry`, `lit`, `opening_hours`, `amenity/shop`

这些都只是为了背景动画，不是为了输出分析指标。

### 2. 如何计算、组合并呈现

最适合的是做一个**预计算动画层**：

- 白天状态：更亮的路网、更多 active service lines、更多点状 support
- 夜晚状态：路网变暗、support 点稀疏、夜间服务线保留但减少

这里不要显示数字，更像视觉导入。

### 3. 页面指标与叙事作用

这一页最好**没有正式指标**。
它的作用只是把主线立住：

**“同一座城市、同一段路，到了夜晚，会要求乘客付出不同代价。”**

---

## Page 1 — 问题和需求描述

### 1. 需要哪些数据集、哪些字段

这一页核心不是外部数据，而是**persona / scenario metadata**：

- 预设 persona：晚归学生、预算有限乘客、夜班工作者、不熟悉系统的人
- 用户自选情境：alone / late / carrying bags / unfamiliar area
- 可选地从 Page 3 的 route metrics 中读入：`walk_minutes`, `wait_minutes`, `support_count_open`, `lit_share`, `recovery_penalty`

如果你想让这页更“有根据”，可以调用 Page 3 的实际路线结果做示例卡片，而不是凭空写文案。

### 2. 如何计算、组合并呈现

把用户勾选项转成**偏好权重**，而不是算法推荐：

- `walk weight`
- `wait weight`
- `support weight`
- `lighting/activity weight`
- `recovery weight`

### 3. 页面指标与叙事作用

这一页展示的不是城市指标，而是**“我此刻最在意什么”**。
叙事作用是把项目从“城市分析”拉回到“乘客判断”，为后面的 trade-off cards 做准备。

---

## Page 2 — 伦敦现状大描述

这是第一个真正需要较完整数据层的页面。你的文档里要求它展示 **白天 vs 夜间灯光变化、公交地铁线路/站点数量变化、平均等待时间变化**，以及 support/activity 的日夜切换感。

### 1. 需要哪些数据集、哪些字段

### A. 交通网络与服务规模

- **TfL Unified API / timetable / route data**  
  字段：`mode`, `line_id`, `route_id`, `stop_point_id`, `departure_time`, `arrival_time`, `route_geometry`, `status/disruption`
- **NaPTAN**  
  字段：`atco_code/stop_id`, `name`, `lat/lon`, `stop_type`

### B. 平均等待 / 可靠性背景

- **TfL buses performance data**  
  字段：`Excess Waiting Time (EWT)`, route/borough/time period
- **TfL Underground performance data**  
  字段：`Lost Customer Hours`, `Average excess journey time`, `% scheduled operated`
- **TfL real-time arrivals / status**  
  字段：predicted arrival/departure、current status/disruptions

### C. 灯光与照明 proxy

- **NASA Black Marble**  
  字段：`nighttime radiance`
- **OSM `lit=*`**  
  字段：`lit`, `geometry`

Black Marble 更适合城市尺度背景；OSM `lit` 更适合路段是否有灯。

### D. Activity / support proxy

- **OSM POI + opening_hours**  
  字段：`amenity/shop`, `opening_hours`, `geometry`
- **GLA Night Time Observatory / London’s Night Time Economy by MSOA**  
  字段：夜间经济 workplaces / employees、区域夜间活跃度 proxy
- **TfL station footfall**  
  字段：station-level footfall / taps

公开的小时级高质量 footfall 在 HSDS 里更强，但它是订阅型；对课程项目，更适合作为“若能访问则增强”，不是必须。

### 2. 这些字段如何计算、组合并呈现

建议把 Page 2 做成**区域/全伦敦层面的 day-night switch**：

- **Active service count**  
  在白天、晚间、深夜三个时间窗内，统计 active lines、active stops、单位区域内可达 stop 数。
- **Average service spacing / waiting context**  
  按 stop 或区域统计平均 headway；再用 EWT / excess journey time 做背景解释。
- **Support availability index**  
  统计某区域在当前时间窗“开门的 support POI 密度”：药店、公厕、便利店、车站厕所、AED、医院等。
- **Activity context index**  
  公开版：`station footfall percentile + night-time economy employment density + open-late POI density`
- **Lighting context**  
  城市尺度用 Black Marble radiance；步行网络层用 `lit` 路段占比。

### 3. 页面上的指标是什么、叙事作用是什么

建议输出这 5 组指标：

- active lines / active stops
- mean headway / average wait context
- support density
- activity context
- lighting context

叙事作用不是“伦敦夜晚危险”，而是：
**“夜晚不是简单变黑，而是服务变薄、support 变少、等待变重、活动感变弱。”**
这页是从宏观城市进入路线比较的桥梁。

---

## Page 3 — 同一 OD 不同时间的对比

这是你的网站核心页。你文档里已经写得很清楚：这里要做 **Daytime / Evening / Late Night 并列比较**，上半部分路线地图、下半部分六张 comparison cards，并且要有 **Journey timeline** 和 **What if you miss this connection?**。

### 1. 需要哪些数据集、哪些字段

### A. 路线本体

- **TfL Journey Planner / Unified API**  
  字段：`from`, `to`, `departure_time`, `legs`, `mode`, `duration`, `transfer_count`, `fare`, `walk_time`, `route_geometry`, `stop_point_id`
- **TfL arrivals / status / disruptions**  
  字段：`predicted_arrival`, `predicted_departure`, `disruption`, `planned_works`

### B. 站点与可恢复性

- **NaPTAN / TfL stop data**  
  字段：`stop_id`, `name`, `location`
- **TfL station topology / toilets / lifts / step-free / live lift disruption**  
  字段：`toilet`, `accessible_toilet`, `lift`, `step_free`, `facility_status`

### C. Support 设施

- **OSM POI + opening_hours**
- **NHS Find a Pharmacy / EPS DoS API**
- **NHS Directory of Healthcare Services API**
- **BHF The Circuit AED dataset**
- **TfL public toilets / station toilets**
- **GLA public toilets dataset（旧，只能补充）**

关键字段：`type`, `geometry`, `opening_hours`, `availability`, `access_type`, `name`。

### D. Activity / exposure / lighting

- **TfL station footfall**
- **GLA night-time economy by MSOA**
- **OSM open-late POIs**
- **OSM `lit=*`**
- **Black Marble（仅作局部背景，不作为街段真值）**
- **Police API（可选，仅 context）**

### 2. 这些字段如何计算、组合并呈现

这页最关键的是把路线拆成 **walk → wait → ride → transfer → wait → final walk**。
然后对每一段单独算指标，再汇总到六张 cards：

### Functional cost

- `total_duration`
- `walk_minutes`
- `transfer_count`
- `fare`（可选）

### Waiting burden

- `sum(wait_time)`
- `max_single_wait`
- `wait_share_of_journey`

### Service uncertainty

- `mean_headway_at_used_stops`
- `arrival_prediction_gap`
- `current_disruption_count`
- `fallback_services_within_X_min`
- `missed_connection_penalty`

### Support access

- 在 stop buffer 或 walking segment buffer 内统计当前时间窗“开门的”药店、便利店、厕所、AED、医院、车站设施数量
- 也可算最近 support 的 network distance

### Activity context

- `station_footfall_percentile`
- `open_late_POI_density`
- `night_time_economy_intensity`

这不是“真实人流”，是“有人感 / 城市仍在运行”的 proxy。

### Lighting proxy

- `lit_share_on_walking_segments`
- `mean_radiance_context`（可选，仅小范围背景）
- 若有 borough street-light inventory，可再增强，但不是必须

### Missed connection simulation

- 在关键 transfer 节点，把原 itinerary 中这班车视为 missed
- 重新找 next feasible departure
- 输出：`extra_wait`, `fewer_backup_options`, `support_nearby_thinner`

这正好对应你文档里的 recovery difficulty。

### 3. 页面上的指标是什么、叙事作用是什么

建议页面上固定只显示六张卡：

- Functional cost
- Waiting burden
- Service uncertainty
- Support access
- Activity context
- Lighting proxy

这页的叙事作用是全站最重要的一句：
**“路线不是简单变慢，而是整个支持结构、恢复能力和暴露情境都变了。”**
因此这里一定不要合成 single score，也不要输出 best route。

---

## Page 4 — What Changes After Dark：变化来自什么

这页本质上是把 Page 3 的结果**拆解成方法页**。你文档里已经明确它是五大模块的 mechanism page，而且每个模块最好加一句 “This is a proxy, not a verdict.”。

### 1. 需要哪些数据集、哪些字段

数据和 Page 3 基本相同，但要按五大模块重新组织：

- **Functional Travel**：Journey Planner / timetables / routes
- **Waiting and Service Uncertainty**：arrivals、status、disruptions、EWT、Underground performance
- **Support Access**：OSM + NHS + BHF + TfL toilets
- **Activity and Exposure Proxies**：station footfall + NTE by MSOA + optional police context
- **Lighting Proxy**：OSM `lit` + Black Marble

### 2. 这些字段如何计算、组合并呈现

这页不需要增加新模型，只需要把公式说清：

- **Functional Travel** = travel time + walk time + transfers
- **Service Uncertainty** = headway + arrivals deviation + status/disruption + recovery alternatives
- **Support Access** = open support count / nearest support distance / station facilities
- **Activity Context** = footfall / late-open POIs / NTE proxy
- **Lighting Proxy** = lit share + area radiance context

每个模块旁边放两句话：

- **它表达什么**
- **它不表达什么**

### 3. 页面上的指标是什么、叙事作用是什么

这页的指标不是给用户下判断，而是给用户和老师看：
**这个 prototype 为什么这样算，以及为什么这些东西不能被压成一个 danger score。**
这页会显著提高你的方法成熟度。

---

## Page 5 — City-wide Fairness：谁在夜晚更容易失去高支持出行

你文档里要求它回答的不是“哪里更危险”，而是“哪些区域在夜晚相对白天下降更多”，包括 support thinning、service continuity 变弱、recovery options 变少、activity decline 等。

### 1. 需要哪些数据集、哪些字段

### A. 空间单元

- **GLA / ONS statistical boundaries**：LSOA / MSOA / borough
- **PTAL grid 2023**：公共交通可达性基线

### B. 夜间服务变化

- **TfL timetable / route / stop / status**
- **TfL bus performance / Underground performance**
- **NaPTAN**

字段：active route count、active stop count、headway、status、performance background。

### C. Support 与 activity

- **OSM open-late POIs**
- **NHS pharmacy / healthcare**
- **BHF AED**
- **TfL toilets / GLA public toilets**
- **TfL station footfall**
- **GLA Night Time Economy by MSOA**
- **HSDS hourly footfall（若能访问则增强）**

### D. 公平背景

- **Census 2021 / Nomis**
- **IMD 2025**
- 可选：income、student share、no-car households 等

### E. Lighting / exposure

- **OSM `lit=*`**
- **Black Marble**
- **Police API（仅 contextual exposure）**

### 2. 这些字段如何计算、组合并呈现

这一页最适合的不是“夜晚绝对值”，而是**夜晚相对白天的跌幅**。
建议对每个 LSOA / MSOA / hex 计算：

### Support thinning

- `(open_support_density_night - open_support_density_day) / open_support_density_day`

### Service continuity loss

- active stops / active lines / headway 的日夜落差

### Recovery difficulty increase

- 区域内典型 stop 的 fallback routes 数量下降
- missed-connection 后平均额外等待增加

### Activity decline

- footfall / late-open POI / night-time economy proxy 的综合跌幅

### Waiting burden increase

- 平均可达 stop 的 scheduled / excess waiting 上升

### Lighting-related burden

- 照明本身不随时段变化，因此不要做“lighting 日夜跌幅”
- 更好的做法是：**night walking burden under low-light context**
- 即：夜间更长的 walk exposure × 低 `lit_share` 区域

这样就避免了伪造“灯光在夜里减少”这种逻辑问题。

### 3. 页面上的指标是什么、叙事作用是什么

这页最适合的 5 个切换图层就是：

- waiting burden increase
- support access loss
- recovery difficulty increase
- activity decline
- low-light walking burden

叙事作用是把公平问题定义成：
**mobility support inequality**，不是 safety ranking。
也就是说，有些区域夜里不是“更危险”，而是**更容易失去高支持、可恢复、可理解的公共交通体验**。

---

## Page 6 — What to do：Choose Your Route And Time Carefully

你文档里这页本质上是 **persona switch + hourly comparison**，强调 “same route, different burden profile” 和 “A faster route is not always a lighter journey.”。

### 1. 需要哪些数据集、哪些字段

这一页基本复用 Page 3 的全部数据，但要增加两层：

### A. Persona weight file（自定义，不是外部数据）

- `student`: wait / someone-around / support
- `budget`: fare / missed-connection penalty
- `night_worker`: continuity / reliability
- `unfamiliar`: transfer complexity / recovery

### B. Hourly itinerary snapshots

- 同一 OD 每小时或每 2 小时跑一次 route metrics
- 字段同 Page 3：wait, walk, support, activity, lighting, recovery, fare

如果你要在这里加入票价考虑，TfL Unified API 也提供 fares。

### 2. 这些字段如何计算、组合并呈现

这里最重要的不是加一个模型，而是做两件事：

### A. Persona emphasis，而不是总分

- 同样的六张 cards 保持不变
- 只是不同 persona 让不同卡高亮、解释文案变化

### B. Time-of-day curves

- 对同一 OD 在 18:00–01:00 每小时计算一次六个指标
- 画 3–4 条最关键曲线：
  - waiting burden over time
  - support availability over time
  - recovery penalty over time
  - optional fare / activity context over time

### 3. 页面上的指标是什么、叙事作用是什么

这页最推荐呈现：

- per-persona highlighted trade-offs
- hourly waiting curve
- hourly support drop curve
- hourly missed-connection penalty curve

叙事作用是让用户意识到：
**不是只有“哪条路线”，还有“几点出发”本身也在改变这段旅程。**
所以最后的输出不是 recommendation，而是 **route-and-time judgement support**。

---

## Page 7 — Reflection / Design Limits

你文档里这页已经写得非常完整：为什么不做总分、为什么 proxy 不等于 reality、为什么不同用户有不同权重、为什么 crime data 只是 context。

### 1. 需要哪些数据集、哪些字段

这页需要的不是新分析数据，而是**source metadata**：

- dataset name
- provider
- update frequency
- spatial resolution
- temporal resolution
- official or crowd-sourced
- direct measure or proxy
- access restrictions

最值得明确写出的限制有：

- **Black Marble**：daily/monthly/yearly，约 500m 级，更适合城市尺度，不是街段实测亮度
- **OSM `lit`**：表示“有无照明”，不是测得 brightness
- **Police street-level crime**：近似位置，不是 exact location
- **HSDS footfall**：很强，但订阅访问
- **NHS APIs**：适合机器查询，但可能涉及 onboarding / access complexity
- **Service uncertainty**：只能由 timetable + arrivals + status 推断，不是真实延误概率

### 2. 这些字段如何计算、组合并呈现

最适合的是做一个很干净的 **source/proxy matrix**：

- “This shows…”
- “This does not show…”
- “Why it is still useful…”

也可以加一个简洁的质量标签：

- **Official direct**
- **Official contextual**
- **Open proxy**
- **Restricted enhancement**

### 3. 页面上的指标是什么、叙事作用是什么

这页最好**没有新的比较指标**。
它的作用是把整个项目从“漂亮网页”拉成“有方法边界意识的设计原型”。
这一页会直接回应老师最在意的那件事：
**你知道自己在比较什么，也知道自己没有测到什么。**

---

## Page 8 — 结尾页

### 1. 需要哪些数据集、哪些字段

这一页不需要新数据。
可选地复用：

- Page 2 的一条城市级 summary
- Page 5 的一张公平地图缩略图
- Page 3 的一组典型 trade-off cards 缩略图

## 2. 如何计算、组合并呈现

直接复用，不再新增计算。

## 3. 页面上的指标与叙事作用

这里最好只保留一句总结：

**The goal is not to declare the city safe or unsafe. It is to show how support, waiting, and recovery change after dark — and why that matters.**

这会让整个故事首尾闭合。