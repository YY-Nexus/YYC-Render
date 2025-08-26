import { type NextRequest, NextResponse } from "next/server"
import { AuthManager } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "current_user":
        const user = await AuthManager.getCurrentUser()
        return NextResponse.json({
          success: true,
          data: user,
        })

      case "verify_email":
        const token = searchParams.get("token")
        if (!token) {
          return NextResponse.json({ success: false, error: "验证令牌缺失" }, { status: 400 })
        }

        const verifyResult = await AuthManager.verifyEmail(token)
        return NextResponse.json(verifyResult)

      default:
        return NextResponse.json({ success: false, error: "不支持的操作" }, { status: 400 })
    }
  } catch (error) {
    console.error("认证API GET请求失败:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "login":
        const loginResult = await AuthManager.login({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        })

        if (loginResult.success && loginResult.accessToken) {
          const response = NextResponse.json(loginResult)

          // 设置HTTP-only cookies
          response.cookies.set("auth-token", loginResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7天
          })

          if (loginResult.refreshToken) {
            response.cookies.set("refresh-token", loginResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 30 * 24 * 60 * 60, // 30天
            })
          }

          return response
        }

        return NextResponse.json(loginResult)

      case "register":
        const registerResult = await AuthManager.register({
          email: data.email,
          username: data.username,
          password: data.password,
          confirmPassword: data.confirmPassword,
          acceptTerms: data.acceptTerms,
          inviteCode: data.inviteCode,
        })

        return NextResponse.json(registerResult)

      case "wechat_login":
        const wechatResult = await AuthManager.loginWithWechat({
          code: data.code,
          state: data.state,
        })

        if (wechatResult.success && wechatResult.accessToken) {
          const response = NextResponse.json(wechatResult)

          response.cookies.set("auth-token", wechatResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
          })

          if (wechatResult.refreshToken) {
            response.cookies.set("refresh-token", wechatResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 30 * 24 * 60 * 60,
            })
          }

          return response
        }

        return NextResponse.json(wechatResult)

      case "refresh_token":
        const cookieStore = cookies()
        const refreshToken = cookieStore.get("refresh-token")?.value

        if (!refreshToken) {
          return NextResponse.json({ success: false, error: "刷新令牌缺失" }, { status: 401 })
        }

        const refreshResult = await AuthManager.refreshAccessToken(refreshToken)

        if (refreshResult) {
          const response = NextResponse.json({
            success: true,
            data: refreshResult,
          })

          response.cookies.set("auth-token", refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
          })

          return response
        }

        return NextResponse.json({ success: false, error: "刷新令牌无效" }, { status: 401 })

      case "reset_password":
        const resetResult = await AuthManager.resetPassword(data.email)
        return NextResponse.json(resetResult)

      case "change_password":
        const cookieStore2 = cookies()
        const token = cookieStore2.get("auth-token")?.value

        if (!token) {
          return NextResponse.json({ success: false, error: "未登录" }, { status: 401 })
        }

        const payload = AuthManager.verifyToken(token)
        if (!payload) {
          return NextResponse.json({ success: false, error: "令牌无效" }, { status: 401 })
        }

        const changeResult = await AuthManager.changePassword(payload.userId, data.oldPassword, data.newPassword)

        return NextResponse.json(changeResult)

      case "logout":
        const cookieStore3 = cookies()
        const refreshToken2 = cookieStore3.get("refresh-token")?.value

        await AuthManager.logout(refreshToken2)

        const response = NextResponse.json({ success: true })
        response.cookies.delete("auth-token")
        response.cookies.delete("refresh-token")

        return response

      default:
        return NextResponse.json({ success: false, error: "不支持的操作" }, { status: 400 })
    }
  } catch (error) {
    console.error("认证API POST请求失败:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 })
    }

    const payload = AuthManager.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "令牌无效" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...updates } = body

    switch (action) {
      case "update_profile":
        const updateResult = await AuthManager.updateUser(payload.userId, updates)
        return NextResponse.json(updateResult)

      default:
        return NextResponse.json({ success: false, error: "不支持的操作" }, { status: 400 })
    }
  } catch (error) {
    console.error("认证API PUT请求失败:", error)
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 })
  }
}
