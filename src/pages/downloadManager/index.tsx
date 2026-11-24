import AppBar from "@/components/base/appBar";
import Empty from "@/components/base/empty";
import Icon from "@/components/base/icon";
import ListItem from "@/components/base/listItem";
import StatusBar from "@/components/base/statusBar";
import ThemeText from "@/components/base/themeText";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import { iconSizeConst } from "@/constants/uiConst";
import globalStyle from "@/constants/globalStyle";
import Config from "@/core/appConfig";
import { useI18N } from "@/core/i18n";
import pathConst from "@/constants/pathConst";
import { showDialog } from "@/components/dialogs/useDialog";
import rpx from "@/utils/rpx";
import Toast from "@/utils/toast";
import { describePath, exportToFilesApp, openFilesApp, shortPath } from "@/utils/exportFile";
import { sizeFormatter } from "@/utils/fileUtils";
import useColors from "@/hooks/useColors";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ReadDirItem, exists, readDir, unlink } from "react-native-fs";
import { FlatList } from "react-native-gesture-handler";

const AUDIO_RE = /\.(mp3|flac|m4a|ogg|wav|aac|ape|wma|mp4)$/i;

function getDownloadDir() {
    return (
        (Config.getConfig("basic.downloadPath") as string) ??
        pathConst.downloadMusicPath
    );
}

function formatTime(ts?: number) {
    if (!ts) {
        return "";
    }
    const d = new Date(ts * 1000);
    const p = (n: number) => `${n}`.padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
        d.getHours(),
    )}:${p(d.getMinutes())}`;
}

export default function DownloadManager() {
    const { t } = useI18N();
    const colors = useColors();
    const [files, setFiles] = useState<ReadDirItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [dir, setDir] = useState(getDownloadDir());

    const load = useCallback(async () => {
        const target = getDownloadDir();
        setDir(target);
        setLoading(true);
        try {
            if (!(await exists(target))) {
                setFiles([]);
                return;
            }
            const list = (await readDir(target)) ?? [];
            const audios = list
                .filter(f => f.isFile() && AUDIO_RE.test(f.path))
                .sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
            setFiles(audios);
        } catch (e: any) {
            Toast.warn(`读取目录失败：${e?.message ?? e}`);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const totalSize = useMemo(
        () => files.reduce((acc, f) => acc + (f.size ?? 0), 0),
        [files],
    );

    const exportOne = useCallback(async (path: string) => {
        await exportToFilesApp(path);
    }, []);

    const exportAll = useCallback(async () => {
        if (!files.length) {
            Toast.warn("没有可导出的文件");
            return;
        }
        await exportToFilesApp(files.map(f => f.path));
    }, [files]);

    const removeOne = useCallback(
        (item: ReadDirItem) => {
            showDialog("SimpleDialog", {
                title: "删除文件",
                content: `确定删除？\n${item.name}\n\n仅删除本地文件，不影响歌单记录。`,
                okText: "删除",
                cancelText: "取消",
                onOk: async () => {
                    try {
                        await unlink(item.path);
                        Toast.success("已删除");
                        load();
                    } catch (e: any) {
                        Toast.warn(`删除失败：${e?.message ?? e}`);
                    }
                },
            });
        },
        [load],
    );

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <AppBar
                menu={[
                    {
                        icon: "arrow-path",
                        title: "刷新",
                        onPress: load,
                    },
                    {
                        icon: "share",
                        title: "全部导出",
                        onPress: exportAll,
                    },
                    {
                        icon: "folder-outline",
                        title: "文件 App",
                        onPress: openFilesApp,
                    },
                ]}>
                下载管理
            </AppBar>

            <View style={[style.summary, { backgroundColor: colors.appBar }]}>
                <ThemeText fontColor="appBarText" fontSize="subTitle" numberOfLines={1}>
                    {describePath(dir)}
                </ThemeText>
                <ThemeText fontColor="appBarText" fontSize="description" opacity={0.7}>
                    {files.length} 个文件 · {sizeFormatter(totalSize)} · 目录内相对路径：
                    {shortPath(dir)}
                </ThemeText>
            </View>

            <FlatList
                style={globalStyle.fwflex1}
                data={files}
                keyExtractor={item => item.path}
                ListEmptyComponent={
                    loading ? null : (
                        <View style={style.empty}>
                            <Empty />
                            <ThemeText opacity={0.6} style={style.emptyText}>
                                这里还没有文件{"\n"}下载歌曲后会自动出现在这里
                            </ThemeText>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <ListItem withHorizontalPadding heightType="small">
                        <ListItem.Content
                            title={item.name}
                            description={`${sizeFormatter(item.size)} · ${formatTime(
                                item.mtime,
                            )}`}
                        />
                        <View style={style.actions}>
                            <Pressable
                                onPress={() => exportOne(item.path)}
                                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                                <Icon
                                    name="share"
                                    size={iconSizeConst.light}
                                    color={colors.text}
                                    style={style.icon}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => removeOne(item)}
                                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                                <Icon
                                    name="trash-outline"
                                    size={iconSizeConst.light}
                                    color={colors.text}
                                    style={style.icon}
                                />
                            </Pressable>
                        </View>
                    </ListItem>
                )}
            />
            <View style={style.footerHint}>
                <ThemeText fontSize="description" opacity={0.5}>
                    点右侧分享图标可「存储到文件」；文件均为未加密的 mp3 / flac
                </ThemeText>
            </View>
        </VerticalSafeAreaView>
    );
}

const style = StyleSheet.create({
    summary: {
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(20),
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        paddingHorizontal: rpx(16),
    },
    empty: {
        alignItems: "center",
        paddingTop: rpx(120),
    },
    emptyText: {
        textAlign: "center",
        marginTop: rpx(16),
    },
    footerHint: {
        paddingVertical: rpx(16),
        alignItems: "center",
    },
});
