# 测试结果 / Test Results

## 配置测试 / Configuration Tests

### ✅ 测试 1: 代理模式（默认）
**条件**: 无 `.env` 文件  
**预期**: Vite 代理启用，请求转发到后端服务器  
**结果**: ✅ 通过

```
mode: development
VITE_API_BASE_URL: undefined
useProxy: true
```

代理配置:
- `/api/*` → `http://192.168.23.176:3003/*` (可通过 VITE_PROXY_API_TARGET 自定义)
- `/corpus/*` → `http://192.168.23.176:3006/*` (可通过 VITE_PROXY_CORPUS_TARGET 自定义)

### ✅ 测试 2: 直接访问模式
**条件**: 存在 `.env` 文件并设置 `VITE_API_BASE_URL`  
**预期**: Vite 代理禁用，前端直接访问后端  
**结果**: ✅ 通过

```
mode: development
VITE_API_BASE_URL: http://localhost:3003
useProxy: false
```

### ✅ 测试 3: TypeScript 编译
**命令**: `npm run build`  
**结果**: ✅ 编译成功，无错误

### ✅ 测试 4: 代理目标自定义
**条件**: 设置环境变量 `VITE_PROXY_API_TARGET` 和 `VITE_PROXY_CORPUS_TARGET`  
**预期**: 代理目标使用自定义地址  
**结果**: ✅ 通过

## 配置行为总结

| 场景 | .env 文件 | VITE_API_BASE_URL | 代理状态 | 后端访问方式 |
|------|-----------|-------------------|----------|--------------|
| 默认开发 | 不存在 | 未设置 | 启用 | 通过代理 (无 CORS 问题) |
| 自定义代理目标 | 不存在 | 未设置 | 启用 | 通过代理到自定义地址 |
| 直接访问 | 存在 | 已设置 | 禁用 | 直接访问 (需要 CORS) |

## 测试环境

- Node.js: v24.13.0
- Vite: 7.3.1
- TypeScript: 5.9.3
- 测试日期: 2026-02-12

## 注意事项

1. **代理模式（推荐用于开发）**:
   - 无需配置
   - 自动避免 CORS 错误
   - 默认代理到 `192.168.23.176`
   - 可通过环境变量自定义代理目标

2. **直接访问模式（用于生产）**:
   - 需要创建 `.env` 文件
   - 后端服务器必须配置 CORS
   - 适合生产环境或 Nginx 反向代理场景

3. **环境变量优先级**:
   - `VITE_API_BASE_URL` 存在 → 禁用代理
   - `VITE_API_BASE_URL` 不存在 → 启用代理
   - `VITE_PROXY_API_TARGET` → 自定义代理目标（仅当代理启用时生效）
