// ---------- 数据模型(全站共享) ----------

export type WallKind = "splash" | "idea"; // 泼壁墙 / 灵感墙

export type PostVisibility = "published" | "private" | "banned"; // 发布 / 自己可见 / 封贴

export type DevStatus = "developing" | "launched" | "none"; // 正在开发 / 已经发布 / 无

export interface Attachment {
  id: string;
  name: string;
  kind: "image" | "audio" | "file";
  url?: string; // mock 数据里用占位色块预览
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null; // 二级评论:指向主评论 id;不支持更深层
  author: string;
  content: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  attachment?: Attachment;
}

export interface Post {
  id: string;
  wall: WallKind;
  author: string;
  title: string;
  content: string;
  color: string; // 便利贴底色
  x: number; // 画布坐标
  y: number;
  rotation: number; // 错位旋转角
  visibility: PostVisibility;
  devStatus: DevStatus;
  surveyUrl?: string; // 灵感墙:问卷/报表链接
  attachments: Attachment[];
  likes: number;
  dislikes: number;
  createdAt: number;
}

export const PAPER_COLORS = [
  "#FFE14D", // 荧光黄
  "#FF5DA2", // 撞击粉
  "#4DE1FF", // 电光蓝
  "#7CFF6B", // 毒液绿
  "#FF8A3D", // 警示橙
  "#C792FF", // 嘈杂紫
];

export const STATUS_TAG_STYLE: Record<Exclude<DevStatus, "none">, string> = {
  developing: "tag-developing",
  launched: "tag-launched",
};

export const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- 用户 ----------
// 不设固定成员名单(保护隐私),名字由用户自己输入;颜色按名字哈希确定性分配

export function pickPaperColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PAPER_COLORS[h % PAPER_COLORS.length];
}

export const memberColor = pickPaperColor; // 兼容旧引用

// ---------- Mock 数据 ----------

const now = Date.now();

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    wall: "idea",
    author: "阿真",
    title: "我想做一个校园交易平台",
    content:
      "毕业季学长学姐的二手书、电器太多啦!想做一个只限本校的平台,看学号后缀就能认证,面对面自提,拒绝快递费。",
    color: "#FF5DA2",
    x: 120,
    y: 140,
    rotation: -2.5,
    visibility: "published",
    devStatus: "developing",
    surveyUrl: "https://wj.qq.com/example-campus-trade",
    attachments: [
      { id: "a1", name: "原型草图.png", kind: "image" },
      { id: "a2", name: "需求清单.pdf", kind: "file" },
    ],
    likes: 42,
    dislikes: 3,
    createdAt: now - 86400000 * 3,
  },
  {
    id: "p2",
    wall: "idea",
    author: "KonoDioDa",
    title: "食堂窗口排队热力图",
    content:
      "每天中午都要赌哪个窗口人少。做一个实时排队热力图,大家顺手上报排队人数,饭点前看一眼再出发。",
    color: "#4DE1FF",
    x: 620,
    y: 90,
    rotation: 1.8,
    visibility: "published",
    devStatus: "launched",
    surveyUrl: "https://wj.qq.com/example-canteen-heat",
    attachments: [{ id: "a3", name: "食堂实拍.jpg", kind: "image" }],
    likes: 128,
    dislikes: 5,
    createdAt: now - 86400000 * 6,
  },
  {
    id: "p3",
    wall: "idea",
    author: "夜行之",
    title: "拼车回城小黑板",
    content: "周末回家拼车总在群里刷屏。做个小黑板:发布行程、自动匹配同路线的人,车主乘客互留电话。",
    color: "#7CFF6B",
    x: 380,
    y: 420,
    rotation: -1.2,
    visibility: "published",
    devStatus: "developing",
    attachments: [],
    likes: 67,
    dislikes: 2,
    createdAt: now - 86400000 * 2,
  },
  {
    id: "p4",
    wall: "splash",
    author: "泼壁人",
    title: "今天也要加油鸭!",
    content: "高数期中考完了,无论考得怎么样,生活继续,冲!!",
    color: "#FFE14D",
    x: 200,
    y: 180,
    rotation: 3,
    visibility: "published",
    devStatus: "none",
    attachments: [],
    likes: 89,
    dislikes: 1,
    createdAt: now - 3600000 * 5,
  },
  {
    id: "p5",
    wall: "splash",
    author: "匿名",
    title: "图书馆四楼靠窗的位置yyds",
    content: "下午四点的阳光洒在键盘上,谁懂啊。建议都去,别抢我的。",
    color: "#C792FF",
    x: 700,
    y: 460,
    rotation: -4,
    visibility: "published",
    devStatus: "none",
    attachments: [],
    likes: 34,
    dislikes: 0,
    createdAt: now - 3600000 * 20,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    postId: "p1",
    parentId: null,
    author: "小葵",
    content: "支持!二手教材 really 需要,想要链接,做出来我第一个注册。",
    createdAt: now - 86400000 * 2,
    likes: 12,
    dislikes: 0,
  },
  {
    id: "c2",
    postId: "p1",
    parentId: "c1",
    author: "阿真",
    content: "已经在写了!正在开发中,预计下个月开放内测。",
    createdAt: now - 86400000 * 1.5,
    likes: 8,
    dislikes: 0,
  },
  {
    id: "c3",
    postId: "p1",
    parentId: null,
    author: "ada",
    content: "建议加个『以物易物』模式,我有一堆杂物想换。",
    createdAt: now - 86400000,
    likes: 5,
    dislikes: 1,
    attachment: { id: "a4", name: "杂物照片.jpg", kind: "image" },
  },
  {
    id: "c4",
    postId: "p2",
    parentId: null,
    author: "干饭王",
    content: "热力图救我狗命,再也不用排二楼麻辣香锅了。",
    createdAt: now - 86400000 * 4,
    likes: 21,
    dislikes: 0,
  },
];
