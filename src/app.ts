import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import pinoHttp from 'pino-http'
import getLogger from './utils/logger'
import responseSend from './utils/serverResponse'
import userRouter from './routes/user'

const logger = getLogger('App')
const app = express()

// 中介層設定
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// HTTP 請求日誌中介層（使用 Pino）
app.use(
    pinoHttp({
        logger,
        serializers: {
            req(req) {
                req.body = req.raw?.body || req.body
                return req
            },
        },
    })
)

// 提供靜態資源
app.use(express.static(path.join(__dirname, 'public')))

// 健康檢查路由
app.get('/healthcheck', (req: Request, res: Response) => {
    res.status(200).send('OK')
})

// API 路由
app.use('/api/user', userRouter)

// 全域錯誤處理中介層
app.use((err: { status?: number }, req: Request, res: Response) => {
    if (err.status)
        responseSend(res, err.status, '伺服器錯誤')
    else
        responseSend(res, 500, '伺服器錯誤')
})

export default app
