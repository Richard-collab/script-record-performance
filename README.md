# bun-react-template

## 环境变量配置（可选）

### 方式一：使用代理模式（默认，推荐用于开发）

**无需任何配置**，直接启动即可。Vite 开发服务器会自动代理 API 请求到后端服务器，避免 CORS 错误。

- `/api/*` → `http://192.168.23.176:3003/*`
- `/corpus/*` → `http://192.168.23.176:3006/*`

如需自定义代理目标地址，可设置环境变量（不创建 `.env` 文件）：

```bash
VITE_PROXY_API_TARGET=http://your-backend:3003 VITE_PROXY_CORPUS_TARGET=http://your-backend:3006 npm run dev
```

### 方式二：直接访问后端（用于生产环境或自定义配置）

如果需要直接访问后端服务器（不使用代理），请创建 `.env` 文件：

```bash
cp .env.example .env
```

然后根据实际情况修改 API 地址：

```bash
VITE_API_BASE_URL=http://your-api-server:3003
VITE_CORPUS_BASE_URL=http://your-corpus-server:3006
```

**注意**：使用直接访问模式时，后端服务器必须配置 CORS 允许跨域请求。

## 安装和运行

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
