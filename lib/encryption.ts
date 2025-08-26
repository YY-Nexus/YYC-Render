"use client"

import { useState } from "react"

// 数据加密系统
export interface EncryptionConfig {
  algorithm: "AES-GCM" | "AES-CBC" | "RSA-OAEP"
  keyLength: 128 | 192 | 256
  ivLength: 12 | 16
  tagLength?: 128
  iterations?: number
  saltLength?: number
}

export interface EncryptedData {
  data: string
  iv: string
  salt?: string
  tag?: string
  algorithm: string
  timestamp: number
}

export interface KeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
  algorithm: string
  extractable: boolean
}

export interface EncryptionMetrics {
  encryptionTime: number
  decryptionTime: number
  keyGenerationTime: number
  dataSize: number
  encryptedSize: number
  compressionRatio: number
}

export class EncryptionManager {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: "AES-GCM",
    keyLength: 256,
    ivLength: 12,
    tagLength: 128,
    iterations: 100000,
    saltLength: 16,
  }

  private static keyCache: Map<string, CryptoKey> = new Map()
  private static keyPairCache: Map<string, KeyPair> = new Map()

  // 生成加密密钥
  static async generateKey(
    config: Partial<EncryptionConfig> = {},
    password?: string,
  ): Promise<{ key: CryptoKey; keyId: string }> {
    const startTime = Date.now()
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    try {
      let key: CryptoKey

      if (password) {
        // 基于密码生成密钥
        key = await this.deriveKeyFromPassword(password, finalConfig)
      } else {
        // 生成随机密钥
        key = await crypto.subtle.generateKey(
          {
            name: finalConfig.algorithm,
            length: finalConfig.keyLength,
          },
          true, // extractable
          ["encrypt", "decrypt"],
        )
      }

      const keyId = await this.generateKeyId(key)
      this.keyCache.set(keyId, key)

      console.log(`密钥生成完成，耗时: ${Date.now() - startTime}ms`)
      return { key, keyId }
    } catch (error) {
      throw new Error(`密钥生成失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 从密码派生密钥
  private static async deriveKeyFromPassword(password: string, config: EncryptionConfig): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    // 生成盐值
    const salt = crypto.getRandomValues(new Uint8Array(config.saltLength || 16))

    // 导入密码作为密钥材料
    const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, ["deriveKey"])

    // 派生密钥
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: config.iterations || 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      {
        name: config.algorithm,
        length: config.keyLength,
      },
      true,
      ["encrypt", "decrypt"],
    )
  }

  // 生成密钥对（用于非对称加密）
  static async generateKeyPair(algorithm: "RSA-OAEP" | "ECDH" = "RSA-OAEP"): Promise<KeyPair> {
    const startTime = Date.now()

    try {
      let keyPair: CryptoKeyPair

      if (algorithm === "RSA-OAEP") {
        keyPair = await crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true,
          ["encrypt", "decrypt"],
        )
      } else {
        keyPair = await crypto.subtle.generateKey(
          {
            name: "ECDH",
            namedCurve: "P-256",
          },
          true,
          ["deriveKey"],
        )
      }

      const keyPairObj: KeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        algorithm,
        extractable: true,
      }

      const keyPairId = `keypair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.keyPairCache.set(keyPairId, keyPairObj)

      console.log(`密钥对生成完成，耗时: ${Date.now() - startTime}ms`)
      return keyPairObj
    } catch (error) {
      throw new Error(`密钥对生成失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 加密数据
  static async encryptData(
    data: string | ArrayBuffer,
    key: CryptoKey | string,
    config: Partial<EncryptionConfig> = {},
  ): Promise<EncryptedData> {
    const startTime = Date.now()
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    try {
      // 获取密钥
      const cryptoKey = typeof key === "string" ? this.keyCache.get(key) : key
      if (!cryptoKey) {
        throw new Error("无效的加密密钥")
      }

      // 准备数据
      const encoder = new TextEncoder()
      const dataBuffer = typeof data === "string" ? encoder.encode(data) : data

      // 生成初始化向量
      const iv = crypto.getRandomValues(new Uint8Array(finalConfig.ivLength))

      // 执行加密
      let encryptedBuffer: ArrayBuffer

      if (finalConfig.algorithm === "AES-GCM") {
        encryptedBuffer = await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv,
            tagLength: finalConfig.tagLength,
          },
          cryptoKey,
          dataBuffer,
        )
      } else if (finalConfig.algorithm === "AES-CBC") {
        encryptedBuffer = await crypto.subtle.encrypt(
          {
            name: "AES-CBC",
            iv,
          },
          cryptoKey,
          dataBuffer,
        )
      } else {
        throw new Error(`不支持的加密算法: ${finalConfig.algorithm}`)
      }

      // 转换为Base64
      const encryptedArray = new Uint8Array(encryptedBuffer)
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
      const ivBase64 = btoa(String.fromCharCode(...iv))

      const result: EncryptedData = {
        data: encryptedBase64,
        iv: ivBase64,
        algorithm: finalConfig.algorithm,
        timestamp: Date.now(),
      }

      // 如果是GCM模式，提取认证标签
      if (finalConfig.algorithm === "AES-GCM" && finalConfig.tagLength) {
        const tagLength = finalConfig.tagLength / 8
        const tag = encryptedArray.slice(-tagLength)
        result.tag = btoa(String.fromCharCode(...tag))
        result.data = btoa(String.fromCharCode(...encryptedArray.slice(0, -tagLength)))
      }

      console.log(`数据加密完成，耗时: ${Date.now() - startTime}ms`)
      return result
    } catch (error) {
      throw new Error(`数据加密失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 解密数据
  static async decryptData(encryptedData: EncryptedData, key: CryptoKey | string): Promise<string | ArrayBuffer> {
    const startTime = Date.now()

    try {
      // 获取密钥
      const cryptoKey = typeof key === "string" ? this.keyCache.get(key) : key
      if (!cryptoKey) {
        throw new Error("无效的解密密钥")
      }

      // 解码Base64数据
      const encryptedArray = new Uint8Array(
        atob(encryptedData.data)
          .split("")
          .map((char) => char.charCodeAt(0)),
      )
      const iv = new Uint8Array(
        atob(encryptedData.iv)
          .split("")
          .map((char) => char.charCodeAt(0)),
      )

      // 准备解密数据
      let dataToDecrypt = encryptedArray

      // 如果是GCM模式，重新组合数据和标签
      if (encryptedData.algorithm === "AES-GCM" && encryptedData.tag) {
        const tag = new Uint8Array(
          atob(encryptedData.tag)
            .split("")
            .map((char) => char.charCodeAt(0)),
        )
        dataToDecrypt = new Uint8Array(encryptedArray.length + tag.length)
        dataToDecrypt.set(encryptedArray)
        dataToDecrypt.set(tag, encryptedArray.length)
      }

      // 执行解密
      let decryptedBuffer: ArrayBuffer

      if (encryptedData.algorithm === "AES-GCM") {
        decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv,
          },
          cryptoKey,
          dataToDecrypt,
        )
      } else if (encryptedData.algorithm === "AES-CBC") {
        decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: "AES-CBC",
            iv,
          },
          cryptoKey,
          dataToDecrypt,
        )
      } else {
        throw new Error(`不支持的解密算法: ${encryptedData.algorithm}`)
      }

      // 转换为字符串
      const decoder = new TextDecoder()
      const decryptedText = decoder.decode(decryptedBuffer)

      console.log(`数据解密完成，耗时: ${Date.now() - startTime}ms`)
      return decryptedText
    } catch (error) {
      throw new Error(`数据解密失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 加密文件
  static async encryptFile(
    file: File,
    key: CryptoKey | string,
    config: Partial<EncryptionConfig> = {},
    onProgress?: (progress: number) => void,
  ): Promise<EncryptedData> {
    const chunkSize = 64 * 1024 // 64KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    const encryptedChunks: string[] = []

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      const chunkBuffer = await chunk.arrayBuffer()

      const encryptedChunk = await this.encryptData(chunkBuffer, key, config)
      encryptedChunks.push(encryptedChunk.data)

      if (onProgress) {
        onProgress(((i + 1) / totalChunks) * 100)
      }
    }

    // 合并加密的块
    const combinedData = encryptedChunks.join("|")

    return {
      data: combinedData,
      iv: "", // 每个块都有自己的IV
      algorithm: config.algorithm || this.DEFAULT_CONFIG.algorithm,
      timestamp: Date.now(),
    }
  }

  // 生成数字签名
  static async signData(data: string | ArrayBuffer, privateKey: CryptoKey): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = typeof data === "string" ? encoder.encode(data) : data

      const signature = await crypto.subtle.sign("RSA-PSS", privateKey, dataBuffer)

      const signatureArray = new Uint8Array(signature)
      return btoa(String.fromCharCode(...signatureArray))
    } catch (error) {
      throw new Error(`数字签名失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 验证数字签名
  static async verifySignature(data: string | ArrayBuffer, signature: string, publicKey: CryptoKey): Promise<boolean> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = typeof data === "string" ? encoder.encode(data) : data

      const signatureArray = new Uint8Array(
        atob(signature)
          .split("")
          .map((char) => char.charCodeAt(0)),
      )

      return await crypto.subtle.verify("RSA-PSS", publicKey, signatureArray, dataBuffer)
    } catch (error) {
      console.error("签名验证失败:", error)
      return false
    }
  }

  // 生成哈希
  static async generateHash(
    data: string | ArrayBuffer,
    algorithm: "SHA-1" | "SHA-256" | "SHA-512" = "SHA-256",
  ): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = typeof data === "string" ? encoder.encode(data) : data

      const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer)
      const hashArray = new Uint8Array(hashBuffer)

      return Array.from(hashArray)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
    } catch (error) {
      throw new Error(`哈希生成失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 安全随机数生成
  static generateSecureRandom(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length))
  }

  // 生成安全密码
  static generateSecurePassword(
    length = 16,
    options: {
      includeUppercase?: boolean
      includeLowercase?: boolean
      includeNumbers?: boolean
      includeSymbols?: boolean
      excludeSimilar?: boolean
    } = {},
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true,
    } = options

    let charset = ""
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (includeNumbers) charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if (excludeSimilar) {
      charset = charset.replace(/[0O1lI]/g, "")
    }

    if (charset.length === 0) {
      throw new Error("至少需要选择一种字符类型")
    }

    const randomBytes = this.generateSecureRandom(length)
    let password = ""

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length]
    }

    return password
  }

  // 密钥导出
  static async exportKey(key: CryptoKey, format: "raw" | "pkcs8" | "spki" | "jwk" = "raw"): Promise<string> {
    try {
      const exported = await crypto.subtle.exportKey(format, key)

      if (format === "jwk") {
        return JSON.stringify(exported)
      } else {
        const exportedArray = new Uint8Array(exported as ArrayBuffer)
        return btoa(String.fromCharCode(...exportedArray))
      }
    } catch (error) {
      throw new Error(`密钥导出失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 密钥导入
  static async importKey(
    keyData: string,
    algorithm: string,
    format: "raw" | "pkcs8" | "spki" | "jwk" = "raw",
    keyUsages: KeyUsage[] = ["encrypt", "decrypt"],
  ): Promise<CryptoKey> {
    try {
      let keyBuffer: ArrayBuffer | JsonWebKey

      if (format === "jwk") {
        keyBuffer = JSON.parse(keyData)
      } else {
        const keyArray = new Uint8Array(
          atob(keyData)
            .split("")
            .map((char) => char.charCodeAt(0)),
        )
        keyBuffer = keyArray.buffer
      }

      return await crypto.subtle.importKey(format, keyBuffer, { name: algorithm }, true, keyUsages)
    } catch (error) {
      throw new Error(`密钥导入失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 生成密钥ID
  private static async generateKeyId(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key)
    const hash = await crypto.subtle.digest("SHA-256", exported)
    const hashArray = new Uint8Array(hash)

    return Array.from(hashArray.slice(0, 8))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  }

  // 清理缓存
  static clearCache(): void {
    this.keyCache.clear()
    this.keyPairCache.clear()
  }

  // 获取加密统计信息
  static getEncryptionMetrics(
    originalSize: number,
    encryptedSize: number,
    encryptionTime: number,
    decryptionTime = 0,
    keyGenerationTime = 0,
  ): EncryptionMetrics {
    return {
      encryptionTime,
      decryptionTime,
      keyGenerationTime,
      dataSize: originalSize,
      encryptedSize,
      compressionRatio: encryptedSize / originalSize,
    }
  }

  // 安全存储到本地存储
  static async secureStore(key: string, data: any, password?: string): Promise<void> {
    try {
      const jsonData = JSON.stringify(data)
      const { key: cryptoKey } = await this.generateKey({}, password)
      const encrypted = await this.encryptData(jsonData, cryptoKey)

      localStorage.setItem(key, JSON.stringify(encrypted))
    } catch (error) {
      throw new Error(`安全存储失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  // 从本地存储安全读取
  static async secureRetrieve(key: string, password?: string): Promise<any> {
    try {
      const storedData = localStorage.getItem(key)
      if (!storedData) {
        return null
      }

      const encrypted: EncryptedData = JSON.parse(storedData)
      const { key: cryptoKey } = await this.generateKey({}, password)
      const decrypted = await this.decryptData(encrypted, cryptoKey)

      return JSON.parse(decrypted as string)
    } catch (error) {
      throw new Error(`安全读取失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }
}

// React Hook for encryption
export function useEncryption() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const encryptData = async (data: string, password?: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const { key } = await EncryptionManager.generateKey({}, password)
      const encrypted = await EncryptionManager.encryptData(data, key)
      return encrypted
    } catch (err) {
      setError(err instanceof Error ? err.message : "加密失败")
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const decryptData = async (encryptedData: EncryptedData, password?: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const { key } = await EncryptionManager.generateKey({}, password)
      const decrypted = await EncryptionManager.decryptData(encryptedData, key)
      return decrypted as string
    } catch (err) {
      setError(err instanceof Error ? err.message : "解密失败")
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const generateSecurePassword = (length?: number, options?: any) => {
    try {
      return EncryptionManager.generateSecurePassword(length, options)
    } catch (err) {
      setError(err instanceof Error ? err.message : "密码生成失败")
      return ""
    }
  }

  const generateHash = async (data: string, algorithm?: "SHA-1" | "SHA-256" | "SHA-512") => {
    setIsProcessing(true)
    setError(null)

    try {
      const hash = await EncryptionManager.generateHash(data, algorithm)
      return hash
    } catch (err) {
      setError(err instanceof Error ? err.message : "哈希生成失败")
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing,
    error,
    encryptData,
    decryptData,
    generateSecurePassword,
    generateHash,
    reset: () => {
      setIsProcessing(false)
      setError(null)
    },
  }
}
