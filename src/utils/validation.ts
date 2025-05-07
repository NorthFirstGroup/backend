import { validate } from 'uuid'
import dayjs from 'dayjs'

/** 檢查值是否為無效的字串。
 * @param value - 要驗證的值
 * @returns 若為非字串、空白或空字串則回傳 true，否則回傳 false
 */
export const isNotValidString = (value: unknown): boolean => {
    return (
        typeof value !== 'string' || value.trim().length === 0 || value === ''
    )
}

/** 檢查值是否為無效的正整數。
 * @param value - 要驗證的值
 * @returns 若為非數字、負數或非整數則回傳 true，否則回傳 false
 */
export const isNotValidInteger = (value: unknown): boolean => {
    return typeof value !== 'number' || value < 0 || value % 1 !== 0
}

/** 檢查值是否為無效的 UUID。
 * @param value - 要驗證的值
 * @returns 若非有效的 UUID 格式則回傳 true，否則回傳 false
 */
export const isNotValidUuid = (value: unknown): boolean => {
    return typeof value !== 'string' || !validate(value)
}

/** 檢查值是否為無效的使用者名稱（2~10 字，中文、英文或數字）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidUserName = (value: unknown): boolean => {
    const userNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/
    if (!isNotValidString(value)) {
        return !userNamePattern.test(value as string)
    } else {
        return false
    }
}

/** 檢查值是否為無效的電子信箱格式。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidEmail = (value: unknown): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!isNotValidString(value)) {
        return !emailPattern.test(value as string)
    } else {
        return false
    }
}

/** 檢查值是否為無效的密碼（8~16 字，需包含大小寫字母與數字）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidPassword = (value: unknown): boolean => {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    if (!isNotValidString(value)) {
        return !passwordPattern.test(value as string)
    } else {
        return false
    }
}

/** 檢查值是否為無效的 URL（必須為 https 開頭）。
 * @param value - 要驗證的值
 * @returns 若不是有效的 https URL 則回傳 true，否則回傳 false
 */
export const isNotValidUrl = (value: unknown): boolean => {
    return isNotValidString(value) || !(value as string).startsWith('https')
}

/** 檢查值是否為無效的手機號碼格式（09XXXXXXXX）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidPhoneNumber = (value: unknown): boolean => {
    const phonePattern = /^09\d{8}$/;
    if (!isNotValidString(value)) {
        return !phonePattern.test(value as string);
    } else {
        return false;
    }
}

/** 檢查值是否為無效的生日（YYYY-MM-DD）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidBirthday = (value: unknown): boolean => {
    if (isNotValidString(value))
        return true;

    // 檢查格式是否為 YYYY-MM-DD
    const birthdayPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayPattern.test(value as string))
        return true;

    // 檢查日期是否有效，避免不存在的日子 2/30
    const date = dayjs(value as string, 'YYYY-MM-DD', true);
    if (!date.isValid() || date.format('YYYY-MM-DD') !== value)
        return true;

    return false;
}