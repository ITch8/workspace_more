# ReplyBoost（冷邮件回复率 MVP）

Next.js 应用：活动与线索管理、CSV 导入（经 BullMQ 队列由独立 Worker 消费）。数据层为 PostgreSQL（Prisma），队列为 Redis。

## 技术栈

- Next.js 15、React 19、TypeScript
- Prisma + PostgreSQL
- BullMQ + Redis（CSV 导入任务）
- JWT 登录（`JWT_SECRET`）

## 使用 Docker Compose（推荐）

一次性启动 **PostgreSQL**、**Redis**、**Web**、**CSV Worker**、**Nginx**、**DbGate**：

```bash
cd w_m
docker compose up --build
```

浏览器访问：<http://localhost>（Nginx 反向代理到 `web:3000`）。
数据库可视化管理（DbGate）：<http://localhost:3001>。
DbGate 已预置默认连接 `ReplyBoost Local`（主机 `db`，库 `replyboost`，用户 `postgres`）。

Nginx 配置文件路径：`nginx/default.conf`。

首次启动时，`web` 与 `worker` 容器会在启动前执行 `prisma migrate deploy`（Prisma 使用迁移锁，可安全并发执行）。

### 环境变量（Compose）

在仓库根目录创建 `.env`（可选），用于覆盖默认值：

| 变量 | 说明 |
| --- | --- |
| `JWT_SECRET` | 生产环境务必改为足够长的随机串；未设置时 Compose 使用占位值 `change_me_in_dev` |

数据库与 Redis 在 Compose 内已写死为开发用连接串；若需改端口或密码，请同时修改 `docker-compose.yml` 中 `db` / `web` / `worker` 的配置。

### 仅启动数据库与 Redis

在本机用 `npm run dev` 跑 Next 时，可只起基础设施：

```bash
docker compose up -d db redis
```

此时 `.env` 中应使用：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/replyboost?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your_secret"
```

另开终端执行迁移与开发服务：

```bash
npm install
npx prisma migrate dev
npm run dev
npm run worker:csv
```

## 本地开发（不使用 Docker）

1. 安装 Node.js 22+。
2. 复制环境变量模板：`cp .env.example .env`，按实际修改 `DATABASE_URL`、`REDIS_URL`、`JWT_SECRET`。
3. 安装依赖并迁移：

```bash
npm install
npx prisma migrate dev
```

4. 启动应用与 Worker（各需一个终端）：

```bash
npm run dev
npm run worker:csv
```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | Next.js 开发服务器 |
| `npm run build` / `npm run start` | 生产构建与启动 |
| `npm run worker:csv` | BullMQ CSV 导入 Worker |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 开发环境迁移（`migrate dev`） |
| `npm run prisma:deploy` | 生产/CI 迁移（`migrate deploy`） |
| `npm run lint` | ESLint |

## 项目结构（摘要）

- `app/` — 页面与 App Router API
- `lib/` — Prisma、Redis、队列、鉴权等
- `workers/csvImportWorker.ts` — CSV 导入消费者
- `prisma/` — 数据模型与迁移

## 许可证

MIT
