---
description: Validação pré-commit para garantir que o deploy na Vercel funcione
---

Este workflow garante que as dependências estejam sincronizadas e que o projeto compile corretamente antes de você enviar para o GitHub.

### Passos:

1. **Sincronizar Dependências**
Execute este comando para garantir que o `pnpm-lock.yaml` esteja atualizado com o `package.json`.
// turbo
```powershell
npx pnpm install --no-frozen-lockfile
```

2. **Validar Build**
Tente rodar o build localmente. Se este passo falhar aqui, ele certamente falhará na Vercel.
// turbo
```powershell
npm run build
```

3. **Verificar Lint/Tipos (Opcional mas recomendado)**
Se houver erros de TypeScript, o build da Vercel pode falhar dependendo da configuração.
// turbo
```powershell
npx tsc --noEmit
```

Se todos os passos passarem, você pode fazer o commit e push com segurança!
