import { Linking, Platform } from "react-native";
import { DocumentDirectoryPath, exists } from "react-native-fs";
import Share from "react-native-share";
import { getFileName } from "./fileUtils";
import Toast from "./toast";

function stripScheme(p: string) {
    if (!p) {
        return p;
    }
    let out = p.startsWith("file://") ? p.slice(7) : p;
    try {
        out = decodeURI(out);
    } catch {}
    return out;
}

/**
 * 调用系统「存储到「文件」App」面板，让用户自己挑选保存位置。
 * iOS 上这是唯一能真正「选择路径」的方式（可存到 iCloud Drive / 我的 iPhone / 第三方 App）。
 * 支持传单个路径或路径数组（批量导出到同一个目标文件夹）。
 */
export async function exportToFilesApp(input: string | string[]) {
    if (Platform.OS !== "ios") {
        Toast.warn("该功能仅 iOS 可用");
        return;
    }
    const rawList = (Array.isArray(input) ? input : [input])
        .filter(Boolean)
        .map(stripScheme);

    const valid: string[] = [];
    for (const p of rawList) {
        try {
            if (await exists(p)) {
                valid.push(p);
            }
        } catch {}
    }
    if (!valid.length) {
        Toast.warn("文件不存在，可能已被删除");
        return;
    }

    try {
        if (valid.length === 1) {
            await Share.open({
                url: `file://${valid[0]}`,
                type: "audio/*",
                filename: getFileName(valid[0]),
                saveToFiles: true,
                failOnCancel: false,
            });
        } else {
            await Share.open({
                urls: valid.map(p => `file://${p}`),
                type: "audio/*",
                saveToFiles: true,
                failOnCancel: false,
            });
        }
        Toast.success(`已导出 ${valid.length} 个文件`);
    } catch (e: any) {
        Toast.warn(`导出失败：${e?.message ?? e}`);
    }
}

/** 打开系统「文件」App 中本 App 的目录 */
export async function openFilesApp() {
    const candidates = [
        "shareddocuments://",
        `shareddocuments://${DocumentDirectoryPath}`,
    ];
    for (const url of candidates) {
        try {
            if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
                return;
            }
        } catch {}
    }
    Toast.warn("无法打开「文件」App");
}

/** 沙盒 Documents 的绝对路径（用于把 UUID 路径翻译成人类可读的相对路径） */
const DOC_ROOT = DocumentDirectoryPath;

/** 把绝对路径转成相对下载根的短路径，用于列表右侧展示 */
export function shortPath(p: string) {
    const raw = stripScheme(p ?? "");
    if (!raw) {
        return "";
    }
    if (raw === DOC_ROOT) {
        return "根目录";
    }
    if (raw.startsWith(DOC_ROOT + "/")) {
        return raw.slice(DOC_ROOT.length + 1);
    }
    return raw;
}

/** 把沙盒绝对路径翻译成用户能看懂的位置描述（不再暴露 UUID） */
export function describePath(p: string) {
    const raw = stripScheme(p ?? "");
    if (!raw) {
        return "";
    }
    if (raw === DOC_ROOT) {
        return "我的 iPhone → MusicFree（根目录）";
    }
    if (raw.startsWith(DOC_ROOT + "/")) {
        const tail = raw.slice(DOC_ROOT.length + 1);
        return `我的 iPhone → MusicFree → ${tail.split("/").join(" → ")}`;
    }
    // 非本 App 沙盒路径，原样返回
    return raw;
}
