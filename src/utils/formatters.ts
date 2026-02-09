
/**
 * 格式化脚本名称以在 UI 中展示
 * 用户要求不进行删减，直接返回完整名称
 */
export const formatScriptName = (name: string): string => {
    return name;
};


/**
 * 格式化任务名称
 * 通常保留完整，但如果超长则截断
 */
export const formatTaskName = (name: string): string => {
    if (!name) return "";
    if (name.length > 20) {
        return name.substring(0, 18) + '...';
    }
    return name;
};
