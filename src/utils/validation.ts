import { validate } from 'uuid';
import dayjs from 'dayjs';
import { CustomError, RespStatusCode } from './serverResponse';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { dataSource } from '@db/data-source';
import { AreaEntity } from '@entities/Area';
dayjs.extend(customParseFormat);

/** 檢查值是否為無效的字串。
 * @param value - 要驗證的值
 * @returns 若為非字串、空白或空字串則回傳 true，否則回傳 false
 */
export const isNotValidString = (value: unknown): boolean => {
    return typeof value !== 'string' || value.trim().length === 0 || value === '';
};

/** 檢查值是否為無效的正整數。
 * @param value - 要驗證的值
 * @returns 若為非數字、負數或非整數則回傳 true，否則回傳 false
 */
export const isNotValidInteger = (value: unknown): boolean => {
    return typeof value !== 'number' || value < 0 || value % 1 !== 0;
};

/** 檢查值是否為無效的 UUID。
 * @param value - 要驗證的值
 * @returns 若非有效的 UUID 格式則回傳 true，否則回傳 false
 */
export const isNotValidUuid = (value: unknown): boolean => {
    return typeof value !== 'string' || !validate(value);
};

/** 檢查值是否為無效的使用者名稱（2~10 字，中文、英文或數字）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidUserName = (value: unknown): boolean => {
    const userNamePattern = /^[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/;
    if (!isNotValidString(value)) {
        return !userNamePattern.test(value as string);
    } else {
        return false;
    }
};

/** 檢查值是否為無效的電子信箱格式。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidEmail = (value: unknown): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!isNotValidString(value)) {
        return !emailPattern.test(value as string);
    } else {
        return false;
    }
};

/** 檢查值是否為無效的密碼（8~16 字，需包含大小寫字母與數字）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidPassword = (value: unknown): boolean => {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
    if (!isNotValidString(value)) {
        return !passwordPattern.test(value as string);
    } else {
        return false;
    }
};

/** 檢查值是否為無效的 URL（必須為 https 開頭）。
 * @param value - 要驗證的值
 * @returns 若不是有效的 https URL 則回傳 true，否則回傳 false
 */
export const isNotValidUrl = (value: unknown): boolean => {
    return isNotValidString(value) || !(value as string).startsWith('https');
};

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
};

/** 檢查值是否為無效的生日（YYYY-MM-DD）。
 * @param value - 要驗證的值
 * @returns 若格式不符則回傳 true，否則回傳 false
 */
export const isNotValidBirthday = (value: unknown): boolean => {
    if (isNotValidString(value)) return true;

    // 檢查格式是否為 YYYY-MM-DD
    const birthdayPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayPattern.test(value as string)) return true;

    // 檢查日期是否有效，避免不存在的日子 2/30
    const date = dayjs(value as string, 'YYYY-MM-DD', true);
    if (!date.isValid() || date.format('YYYY-MM-DD') !== value) return true;

    return false;
};

/**
 * 檢查輸入字串是否符合指定的日期格式，並且是有效日期
 * @param value - 欲驗證的日期字串
 * @param format - 指定的日期格式，例如 'YYYY-MM-DD HH:mm' 或 'YYYY-MM-DD'
 * @returns true 表示有效，false 表示無效
 */
export const isValidDateFormat = (value: string, format: string): boolean => {
    return dayjs(value, format, true).isValid();
};

/** 驗證必填欄位
 * @param data - 要驗證的值 {}
 * @param fields - 欲驗證的欄位名稱陣列(fields) => ['name', 'email', 'password']
 * @returns 若有欄位未填的話，回傳錯誤訊息陣列，否則回傳空陣列
 * */
const requiredFields = (data: Record<string, unknown>, fields: string[]): string[] => {
    const errorsFields: string[] = [];
    fields.forEach(field => {
        const value = data[field];
        if (value) return;
        if (typeof value === 'string' && !!value.trim()) {
            return;
        }
        errorsFields.push(field);
    });
    return errorsFields;
};
const timeFormat = [
    'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm Z',
    'YYYY-MM-DD HH:mm ZZ',
    'YYYY-MM-DD HH:mm ZZZ',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD'
];
/** 檢查時間格式是否為有效的 YYYY-MM-DD HH:mm:ss 格式
 * @param value - 欲驗證的時間字串
 * @returns 若格式不符則拋出錯誤，否則回傳 dayjs 物件
 */
// TODO: EC2 docker environment
//       check why value = "2025-08-01 13:00 +08:00" is not valid ?
export const validTimeFormat = (value: string, fieldName?: string): dayjs.Dayjs => {
    if (!dayjs(value, timeFormat, true).isValid()) {
        throw new CustomError(
            RespStatusCode.INVALID_DATE,
            fieldName ? `欄位 ${fieldName} 的時間格式不正確` : undefined
        );
    }
    return dayjs(value, timeFormat, true);
};

/** 檢查區域是否為有效的字串 需要await
 * @param areaId - 欲驗證的區域字串
 * @returns 若格式不符則拋出錯誤，否則回傳Number(areaId)
 */
export const validArea = async (areaId: string) => {
    const areaQ = await dataSource.getRepository(AreaEntity).findOneBy({ id: Number(areaId) });
    if (!areaQ) {
        throw new CustomError(RespStatusCode.AREA_ID_NOT_EXIST);
    }
    return Number(areaId);
};

export const validator = {
    requiredFields,
    isNotInteger: isNotValidInteger,
    validTimeFormat,
    validArea
};
