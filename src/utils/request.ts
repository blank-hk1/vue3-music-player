import axios, {AxiosError, type AxiosRequestConfig, AxiosResponse, Method} from 'axios'

const service = axios.create({
    baseURL: import.meta.env.VITE_BASE_API,
    timeout: 5000
})

// 添加请求拦截器
service.interceptors.request.use(
    (config: AxiosRequestConfig | any) => {
        // 在发送请求之前做些什么
        return config
    },
    error => {
        // 对请求错误做些什么
        return Promise.reject(error)
    }
)

// 响应拦截
service.interceptors.response.use(
    (response: AxiosResponse) => {
        // 2xx 范围内的状态码都会触发该函数。
        // 对响应数据做点什么
        if (response.status === 200)  {
            return response
        } else {
            return Promise.reject('系统异常')
        }
    },
    (error: AxiosError<{code: number}>) => {
        // 超出 2xx 范围的状态码都会触发该函数。
        // 对响应错误做点什么
        const { code, message, response } = error
        if (code === 'ERR_NETWORK' || (response && response.data.code === 502)) {
            return Promise.reject('网络异常')
        }
        if (code === 'ECONNABORTED' && message.includes('timeout')) {
            return Promise.reject('请求超时')
        }
        return Promise.reject('系统异常')
    }
)

interface Options {
    needLogin?: boolean
    params?: object
    data?: object
}

export function request<T>(url: string, method: Method, options: Options = {}): Promise<T> {
    const { needLogin = false, params = {}, data = {} } = options
    return new Promise((resolve, reject) => {
        // 携带用户cookie
        const cookie = sessionStorage.getItem('cookie')
        if (needLogin && cookie) {
            Object.assign(data, { cookie })
        }
        service({ url, method, params, data }).then((response: AxiosResponse) => {
            // 接口响应报文格式不规范，对code判断移至api层独立处理
            resolve(response.data)
        }).catch((error: string) => {
            console.error(url, error)
            if (error === '网络异常' || error === '请求超时') {
                reject('网络异常')
            } else {
                ElMessage({
                    message: error,
                    type: 'error',
                    duration: 1000,
                    center: true
                })
                reject()
            }
        })
    })
}

