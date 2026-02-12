# bun-react-template

## 环境变量配置

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

根据实际情况修改 API 地址：

```bash
VITE_API_BASE_URL=http://your-api-server:3003
VITE_CORPUS_BASE_URL=http://your-corpus-server:3006
```

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
