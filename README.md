# Smart Study Backend Setup Guide

Este documento descreve como configurar e rodar o backend do Smart Study Platform usando Node.js e Docker. Siga os passos abaixo para garantir que o ambiente esteja configurado corretamente e o servidor esteja funcionando.

## Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado em sua máquina:

- Docker: [Instruções de instalação](https://docs.docker.com/get-docker/)
- Node.js: [Instruções de instalação](https://nodejs.org/)
- adicionar um arquivo "serviceAccount.json" com as credenciais do firebase

## Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente que devem ser configuradas no arquivo `.env`:

### Configurações do MongoDB
- `MONGODB_URI` - URI de conexão com o banco de dados MongoDB

### Configurações do Firebase
- `STORAGE_BUCKET` - Bucket de armazenamento do Firebase
- `GOOGLE_APPLICATION_CREDENTIALS` - Caminho para o arquivo de credenciais do Firebase (serviceAccount.json)

### Configurações de Email (SMTP)
- `SMTP_HOST` - Host do servidor SMTP
- `SMTP_PORT` - Porta do servidor SMTP
- `EMAIL` - Email para envio de mensagens
- `PASS` - Senha do email

### Configurações do Twilio (WhatsApp)
- `ACCOUNT_SID` - SID da conta Twilio
- `AUTH_TOKEN` - Token de autenticação do Twilio
- `NUMBER` - Número do WhatsApp para envio de mensagens
- `CONTENT_SID` - ID do conteúdo da mensagem do WhatsApp

#### Rodando o Backend com Docker no Windows (WSL)

Se você estiver utilizando Windows e WSL, siga as etapas abaixo para garantir que tudo funcione corretamente com Docker.

### Passo 1: Instale o WSL

Certifique-se de que o WSL esteja instalado em sua máquina e que você esteja usando uma distribuição Linux (recomendamos Ubuntu). Caso não tenha o WSL instalado, você pode seguir as instruções [aqui](https://docs.microsoft.com/pt-br/windows/wsl/install).

### Passo 2: Instale o Docker Desktop

1. Baixe e instale o Docker Desktop para Windows: [Docker Desktop Download](https://www.docker.com/products/docker-desktop).
2. Durante a instalação, certifique-se de habilitar a opção de integração com WSL2.
3. Após a instalação, inicie o Docker Desktop e verifique se ele está rodando.
SS
### Passo 3: Configure o WSL com Docker

Abra seu terminal WSL e configure o Docker para funcionar corretamente com o WSL. O Docker Desktop deve detectar automaticamente a instalação do WSL e integrá-la. Certifique-se de que sua distribuição Linux está selecionada nas configurações do Docker Desktop.

### Passo 4: Construir e Rodar a Imagem Docker

Navegue até o diretório do projeto no terminal WSL e execute os seguintes comandos:

```bash
docker build -t smart_study_backend .
docker run -p 8080:8080 smart_study_backend
```