import pathConst from "@/constants/pathConst";
import FastImage from "react-native-fast-image";
import { Platform } from "react-native";
import RNFS, {
    CachesDirectoryPath,
    DocumentDirectoryPath,
    PicturesDirectoryPath,
    copyFile,
    downloadFile,
    exists,
    mkdir,
    readDir,
    unlink,
    writeFile,
} from "react-native-fs";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { errorLog } from "./log";
import path from "path-browserify";
import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";

const galleryBasePath = `${PicturesDirectoryPath || DocumentDirectoryPath}/MusicFree/`;

function stripFileScheme(filePath: string) {
    return filePath.startsWith("file://") ? decodeURI(filePath.slice(7)) : filePath;
}

function guessImageExt(src: string) {
    const clean = src.split("?")[0]?.toLowerCase() ?? "";
    if (clean.includes(".png") || src.includes("image/png")) {
        return "png";
    }
    if (clean.includes(".webp") || src.includes("image/webp")) {
        return "webp";
    }
    if (clean.includes(".gif") || src.includes("image/gif")) {
        return "gif";
    }
    return "jpg";
}

function toFileUri(filePath: string) {
    return filePath.startsWith("file://") ? filePath : `file://${filePath}`;
}

/**
 * 将封面/图片资源规范为 Image/FastImage 可用的 source
 */
export function normalizeImageSource(
    src: string | number | { uri?: string } | undefined | null,
): { uri: string } | number | undefined {
    if (src === undefined || src === null || src === "") {
        return undefined;
    }
    if (typeof src === "number") {
        return src;
    }
    if (typeof src === "object" && src.uri) {
        return { uri: src.uri };
    }
    if (typeof src === "string") {
        if (/^https?:\/\//i.test(src) || src.startsWith("data:")) {
            return { uri: src };
        }
        if (src.startsWith("file://")) {
            return { uri: src };
        }
        // 本地绝对路径
        if (src.startsWith("/")) {
            return { uri: toFileUri(src) };
        }
        return { uri: src };
    }
    return undefined;
}

/**
 * 将远程/本地/Base64/资源 id 图片落到本地缓存文件
 */
async function ensureLocalImageFile(src: string | number) {
    if (src === undefined || src === null || src === "") {
        throw new Error("Empty image source");
    }

    // 打包进 App 的本地资源
    if (typeof src === "number") {
        const resolved = resolveAssetSource(src) as { uri?: string } | null;
        if (!resolved?.uri) {
            throw new Error("Invalid asset source");
        }
        return ensureLocalImageFile(resolved.uri);
    }

    const ext = guessImageExt(src);
    const dest = `${CachesDirectoryPath}/musicfree_gallery_${Date.now()}.${ext}`;

    if (src.startsWith("data:")) {
        const matched = src.match(/^data:image\/[\w+.-]+;base64,(.+)$/i);
        if (!matched?.[1]) {
            throw new Error("Invalid data URI");
        }
        await writeFile(dest, matched[1], "base64");
        return dest;
    }

    const localPath = stripFileScheme(src);
    if (await exists(localPath)) {
        await copyFile(localPath, dest);
        return dest;
    }

    // resolveAssetSource 在 iOS 上可能给出 http 形式的 bundle 资源
    if (/^https?:\/\//i.test(src) || src.startsWith("asset:") || src.startsWith("ph://")) {
        // ph:// 等相册资源直接交给 CameraRoll，不走下载
        if (src.startsWith("ph://") || src.startsWith("assets-library:")) {
            return src;
        }
        if (/^https?:\/\//i.test(src)) {
            const { promise } = downloadFile({
                fromUrl: src,
                toFile: dest,
                background: true,
            });
            const result = await promise;
            if (result.statusCode && (result.statusCode < 200 || result.statusCode >= 300)) {
                throw new Error(`Download failed (${result.statusCode})`);
            }
            if (!(await exists(dest))) {
                throw new Error("Download failed");
            }
            return dest;
        }
    }

    throw new Error("Unsupported image source");
}

/**
 * 将图片保存到系统相册
 * @param src 图片地址 / 本地路径 / 资源 id
 * @returns 保存后的标识或路径
 */
export async function saveToGallery(src: string | number) {
    const localPath = await ensureLocalImageFile(src);

    // 已是系统相册 URI
    if (
        typeof localPath === "string" &&
        (localPath.startsWith("ph://") || localPath.startsWith("assets-library:"))
    ) {
        return localPath;
    }

    const fileUri = toFileUri(localPath);

    if (Platform.OS === "ios") {
        const saved = await CameraRoll.saveAsset(fileUri, { type: "photo" });
        return saved?.node?.image?.uri || saved?.node?.id || fileUri;
    }

    // Android：写入 Pictures，并通知媒体库
    if (!(await exists(galleryBasePath))) {
        await mkdir(galleryBasePath);
    }
    const ext = guessImageExt(typeof src === "string" ? src : localPath);
    const fileName = `${galleryBasePath}${Date.now()}.${ext}`;
    await copyFile(stripFileScheme(localPath), fileName);
    try {
        await CameraRoll.saveAsset(toFileUri(fileName), { type: "photo" });
    } catch {
        // 部分机型 Pictures 目录写入已足够，忽略媒体库登记失败
    }
    return fileName;
}

export function sizeFormatter(bytes: number | string) {
    if (typeof bytes === "string") {
        return bytes;
    }
    if (bytes === 0) {
        return "0B";
    }
    let k = 1024,
        sizes = ["B", "KB", "MB", "GB"],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + sizes[i];
}

export async function checkAndCreateDir(dirPath: string) {
    const filePath = dirPath;
    try {
        if (!(await exists(filePath))) {
            await mkdir(filePath);
        }
    } catch (e) {
        errorLog("无法初始化目录", { path: dirPath, e });
    }
}

async function getFolderSize(dirPath: string): Promise<number> {
    let size = 0;
    try {
        const fns = await readDir(dirPath);
        for (let fn of fns) {
            if (fn.isFile()) {
                size += fn.size;
            }
            // todo: 可以改成并行 promise.all
            if (fn.isDirectory()) {
                size += await getFolderSize(fn.path);
            }
        }
    } catch {}
    return size;
}

export async function getCacheSize(
    type: "music" | "lyric" | "image",
): Promise<number> {
    if (type === "music") {
        return getFolderSize(pathConst.musicCachePath);
    } else if (type === "lyric") {
        return getFolderSize(pathConst.lrcCachePath);
    } else if (type === "image") {
        return getFolderSize(pathConst.imageCachePath);
    }
    throw new Error();
}

export async function clearCache(type: "music" | "lyric" | "image") {
    if (type === "music") {
        try {
            if (await exists(pathConst.musicCachePath)) {
                return unlink(pathConst.musicCachePath);
            }
        } catch {}
    } else if (type === "lyric") {
        try {
            const lrcs = readDir(pathConst.lrcCachePath);
            return Promise.all((await lrcs).map(_ => unlink(_.path)));
        } catch {}
    } else if (type === "image") {
        return FastImage.clearDiskCache();
    }
}

export function addFileScheme(fileName: string) {
    if (fileName.startsWith("/")) {
        return `file://${fileName}`;
    }
    return fileName;
}

export function addRandomHash(url: string) {
    if (url.indexOf("#") === -1) {
        return `${url}#${Date.now()}`;
    }
    return url;
}

export function trimHash(url: string) {
    const index = url.lastIndexOf("#");
    if (index === -1) {
        return url;
    }
    return url.substring(0, index);
}

export function escapeCharacter(str?: string) {
    return str !== undefined ? `${str}`.replace(/[/|\\?*"<>:]+/g, "_") : "";
}

export function getDirectory(dirPath: string) {
    const lastSlash = dirPath.lastIndexOf("/");
    if (lastSlash === -1) {
        return dirPath;
    }
    return dirPath.slice(0, lastSlash);
}

export function getFileName(filePath: string, withoutExt?: boolean) {
    const lastSlash = filePath.lastIndexOf("/");
    if (lastSlash === -1) {
        return filePath;
    }
    let fileName = filePath.slice(lastSlash + 1);
    if (withoutExt) {
        const lastDot = fileName.lastIndexOf(".");
        fileName = lastDot === -1 ? fileName : fileName.slice(0, lastDot);
    }

    try {
        return decodeURIComponent(fileName);
    } catch {
        return fileName;
    }
}

export async function mkdirR(directory: string) {
    let folder = directory;
    const checkStack: string[] = [];
    while (folder.length > 15) {
        checkStack.push(folder);
        folder = path.dirname(folder);
    }
    let existPos = 0;
    for (let i = 0; i < checkStack.length; ++i) {
        const isExist = await exists(checkStack[i]);
        if (isExist) {
            existPos = i;
            break;
        }
    }

    for (let j = existPos - 1; j >= 0; --j) {
        try {
            await mkdir(checkStack[j]);
        } catch (e) {
            console.log("error", e);
        }
    }
}

export async function writeInChunks(
    filePath: string,
    data,
    chunkSize = 1024 * 1024 * 2,
) {
    let offset = 0;
    if (await exists(filePath)) {
        await unlink(filePath);
    }

    while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        if (offset === 0) {
            await RNFS.writeFile(filePath, chunk, "utf8");
        } else {
            await RNFS.appendFile(filePath, chunk, "utf8");
        }
        offset += chunkSize;
    }
}


export function resolveImportedAssetOrPath(pathOrAsset: string | number | undefined) {
    return pathOrAsset === undefined
        ? undefined
        : typeof pathOrAsset === "string"
            ? pathOrAsset
            : resolveImportedAsset(pathOrAsset);
}

function resolveImportedAsset(id?: number) {
    return id
        ? (resolveAssetSource(id) as { uri: string } | null) ?? undefined
        : undefined;
}