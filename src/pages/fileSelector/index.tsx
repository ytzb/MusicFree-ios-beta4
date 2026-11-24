import Empty from "@/components/base/empty";
import Icon from "@/components/base/icon";
import IconButton from "@/components/base/iconButton";
import Loading from "@/components/base/loading";
import StatusBar from "@/components/base/statusBar";
import Button from "@/components/base/textButton.tsx";
import ThemeText from "@/components/base/themeText";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import globalStyle from "@/constants/globalStyle";
import { iconSizeConst } from "@/constants/uiConst";
import i18n from "@/core/i18n";
import { useParams } from "@/core/router";
import useColors from "@/hooks/useColors";
import useHardwareBack from "@/hooks/useHardwareBack";
import rpx from "@/utils/rpx";
import Toast from "@/utils/toast";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    DocumentDirectoryPath,
    exists,
    getAllExternalFilesDirs,
    mkdir,
    readDir,
} from "react-native-fs";
import { FlatList } from "react-native-gesture-handler";
import FileItem from "./fileItem";

interface IPathItem {
    path: string;
    parent: null | IPathItem;
}

interface IFileItem {
    path: string;
    type: "file" | "folder";
}

const ITEM_HEIGHT = rpx(96);

export default function FileSelector() {
    const {
        fileType = "file-and-folder",
        multi = true,
        actionText = i18n.t("common.sure"),
        matchExtension,
        onAction,
    } = useParams<"file-selector">() ?? {};

    const isFolderMode = fileType === "folder";

    const [currentPath, setCurrentPath] = useState<IPathItem>({
        path: "/",
        parent: null,
    });
    const currentPathRef = useRef<IPathItem>(currentPath);
    const [filesData, setFilesData] = useState<IFileItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<IFileItem[]>([]);

    const checkedPaths = useMemo(
        () => checkedItems.map(_ => _.path),
        [checkedItems],
    );
    const navigation = useNavigation();
    const colors = useColors();
    const [loading, setLoading] = useState(false);

    /** 新建文件夹弹窗 */
    const [createVisible, setCreateVisible] = useState(false);
    const [createName, setCreateName] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                // 根目录：iOS 直接进沙盒 Documents；Android 尝试找存储卡
                if (currentPath.path === "/") {
                    if (Platform.OS === "ios") {
                        if (!cancelled) {
                            setCurrentPath({
                                path: DocumentDirectoryPath,
                                parent: null,
                            });
                        }
                        return;
                    }
                    try {
                        const allExt = await getAllExternalFilesDirs();
                        if (allExt.length > 1) {
                            const sdCardPaths = allExt.map(sdp =>
                                sdp.substring(0, sdp.indexOf("/Android")),
                            );
                            const existsList = await Promise.all(
                                sdCardPaths.map(_ => exists(_)),
                            );
                            if (existsList.every(Boolean) && !cancelled) {
                                setFilesData(
                                    sdCardPaths.map(_ => ({
                                        type: "folder" as const,
                                        path: _,
                                    })),
                                );
                                return;
                            }
                        }
                    } catch {}
                    if (!cancelled) {
                        setCurrentPath({
                            path: DocumentDirectoryPath,
                            parent: null,
                        });
                    }
                    return;
                }

                const res = (await readDir(currentPath.path)) ?? [];
                const folders: IFileItem[] = [];
                const files: IFileItem[] = [];
                if (fileType === "folder" || fileType === "file-and-folder") {
                    res.filter(_ => _.isDirectory()).forEach(_ => {
                        folders.push({ type: "folder", path: _.path });
                    });
                }
                if (fileType === "file" || fileType === "file-and-folder") {
                    res.filter(
                        _ =>
                            _.isFile() &&
                            (matchExtension ? matchExtension(_.path) : true),
                    ).forEach(_ => {
                        files.push({ type: "file", path: _.path });
                    });
                }
                if (!cancelled) {
                    setFilesData([...folders, ...files]);
                }
            } catch {
                if (!cancelled) {
                    setFilesData([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        currentPathRef.current = currentPath;
        return () => {
            cancelled = true;
        };
    }, [currentPath.path, fileType]);

    useHardwareBack(() => {
        const _currentPath = currentPathRef.current;
        if (_currentPath.parent !== null) {
            setCurrentPath(_currentPath.parent);
        } else {
            navigation.goBack();
        }
        return true;
    });

    const selectPath = useCallback(
        (item: IFileItem | IFileItem[], nextChecked: boolean) => {
            if (multi) {
                const list = Array.isArray(item) ? item : [item];
                setCheckedItems(prev => {
                    const itemPaths = list.map(_ => _.path);
                    const rest = prev.filter(_ => !itemPaths.includes(_.path));
                    return nextChecked ? [...rest, ...list] : rest;
                });
            } else {
                const list = Array.isArray(item) ? item : [item];
                setCheckedItems(nextChecked ? list : []);
            }
        },
        [multi],
    );

    const enterFolder = useCallback((path: string) => {
        setCheckedItems([]);
        setCurrentPath(prev => ({ parent: prev, path }));
    }, []);

    const submit = useCallback(
        async (items: IFileItem[]) => {
            if (!items.length) {
                Toast.warn("请先勾选一个位置");
                return;
            }
            const shouldBack = await onAction?.(items);
            if (shouldBack) {
                navigation.goBack();
            }
        },
        [onAction, navigation],
    );

    /** 直接使用当前所在目录作为结果 */
    const useCurrentDir = useCallback(async () => {
        if (currentPath.path === "/") {
            Toast.warn("请先进入一个文件夹");
            return;
        }
        await submit([{ type: "folder", path: currentPath.path }]);
    }, [currentPath.path, submit]);

    const doCreateFolder = useCallback(async () => {
        const name = createName.trim().replace(/[/\\?*"<>:|]+/g, "_");
        if (!name) {
            Toast.warn("请输入文件夹名");
            return;
        }
        if (currentPath.path === "/") {
            Toast.warn("请先进入一个文件夹");
            return;
        }
        const target = `${currentPath.path.replace(/\/+$/, "")}/${name}`;
        try {
            if (!(await exists(target))) {
                await mkdir(target);
            }
            setCreateVisible(false);
            setCreateName("");
            enterFolder(target);
            Toast.success("已创建并进入");
        } catch (e: any) {
            Toast.warn(`创建失败：${e?.message ?? e}`);
        }
    }, [createName, currentPath.path, enterFolder]);

    const renderItem = ({ item }: { item: IFileItem }) => {
        const checked = checkedPaths.includes(item.path);
        return (
            <FileItem
                path={item.path}
                type={item.type}
                parentPath={currentPath.path}
                onItemPress={() => {
                    if (item.type === "folder") {
                        // 选目录模式：点整行 = 选中；文件模式：点整行 = 进入
                        if (isFolderMode) {
                            selectPath(item, !checked);
                        } else {
                            enterFolder(item.path);
                        }
                    } else {
                        selectPath(item, !checked);
                    }
                }}
                showEnter={item.type === "folder" && isFolderMode}
                onEnterPress={() => {
                    enterFolder(item.path);
                }}
                checked={checked}
                onCheckedChange={c => {
                    selectPath(item, c);
                }}
            />
        );
    };

    const currentPageAllChecked = useMemo(() => {
        return (
            filesData.length > 0 &&
            filesData.every(file => checkedPaths.includes(file.path))
        );
    }, [filesData, checkedPaths]);

    const renderHeader = () => {
        return (
            <>
                {isFolderMode ? (
                    <View style={style.hint}>
                        <ThemeText fontSize="subTitle" opacity={0.7}>
                            点右侧箭头进入下一级，勾选后点「确定」；也可直接点「用当前目录」
                        </ThemeText>
                    </View>
                ) : null}
                {multi ? (
                    <View style={style.selectAll}>
                        <Button
                            onPress={() => {
                                selectPath(filesData, !currentPageAllChecked);
                            }}>
                            {currentPageAllChecked ? "全不选" : "全选"}
                        </Button>
                    </View>
                ) : null}
            </>
        );
    };

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <View style={[style.header, { backgroundColor: colors.appBar }]}>
                <IconButton
                    sizeType="small"
                    name="arrow-long-left"
                    color={colors.appBarText}
                    onPress={() => {
                        if (currentPath.parent !== null) {
                            setCurrentPath(currentPath.parent);
                        } else {
                            navigation.goBack();
                        }
                    }}
                />
                <ThemeText
                    numberOfLines={2}
                    ellipsizeMode="head"
                    fontColor={"appBarText"}
                    style={style.headerPath}>
                    {currentPath.path}
                </ThemeText>
            </View>
            {loading ? (
                <Loading />
            ) : (
                <FlatList
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={Empty}
                    style={globalStyle.fwflex1}
                    data={filesData}
                    getItemLayout={(_, index) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                    })}
                    renderItem={renderItem}
                />
            )}

            {isFolderMode ? (
                <View
                    style={[
                        style.toolbar,
                        { backgroundColor: colors.appBar },
                    ]}>
                    <Pressable
                        onPress={() => {
                            setCreateName("");
                            setCreateVisible(true);
                        }}
                        style={style.toolbarBtn}>
                        <Icon
                            name="folder-plus"
                            size={iconSizeConst.light}
                            color={colors.appBarText}
                        />
                        <ThemeText fontColor="appBarText" style={style.toolbarText}>
                            新建文件夹
                        </ThemeText>
                    </Pressable>
                    <Pressable onPress={useCurrentDir} style={style.toolbarBtn}>
                        <Icon
                            name="check-circle"
                            size={iconSizeConst.light}
                            color={colors.appBarText}
                        />
                        <ThemeText fontColor="appBarText" style={style.toolbarText}>
                            用当前目录
                        </ThemeText>
                    </Pressable>
                </View>
            ) : null}

            <Pressable
                onPress={() => {
                    submit(checkedItems);
                }}>
                <View style={[style.scanBtn, { backgroundColor: colors.appBar }]}>
                    <ThemeText
                        fontColor={"appBarText"}
                        opacity={checkedItems.length > 0 ? undefined : 0.6}>
                        {actionText}
                        {multi && checkedItems.length > 0
                            ? ` (选中${checkedItems.length})`
                            : ""}
                    </ThemeText>
                </View>
            </Pressable>

            <Modal
                visible={createVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCreateVisible(false)}>
                <View style={style.modalMask}>
                    <View style={style.modalCard}>
                        <ThemeText fontSize="title" fontWeight="bold">
                            新建文件夹
                        </ThemeText>
                        <TextInput
                            value={createName}
                            onChangeText={setCreateName}
                            placeholder="文件夹名称"
                            autoFocus
                            style={style.modalInput}
                        />
                        <View style={style.modalActions}>
                            <TouchableOpacity
                                onPress={() => setCreateVisible(false)}
                                style={style.modalBtn}>
                                <ThemeText>取消</ThemeText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={doCreateFolder}
                                style={style.modalBtn}>
                                <ThemeText fontWeight="bold">创建</ThemeText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </VerticalSafeAreaView>
    );
}

const style = StyleSheet.create({
    header: {
        height: rpx(88),
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: rpx(24),
    },
    headerPath: {
        marginLeft: rpx(28),
    },
    hint: {
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(16),
    },
    scanBtn: {
        width: "100%",
        height: rpx(120),
        alignItems: "center",
        justifyContent: "center",
    },
    selectAll: {
        width: "100%",
        height: ITEM_HEIGHT,
        paddingHorizontal: rpx(24),
        flexDirection: "row",
        alignItems: "center",
    },
    toolbar: {
        width: "100%",
        height: rpx(96),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },
    toolbarBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: rpx(16),
        height: "100%",
    },
    toolbarText: {
        marginLeft: rpx(10),
    },
    modalMask: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalCard: {
        width: rpx(580),
        borderRadius: rpx(24),
        backgroundColor: "#2a2a2a",
        padding: rpx(32),
    },
    modalInput: {
        marginTop: rpx(24),
        height: rpx(88),
        borderRadius: rpx(12),
        paddingHorizontal: rpx(20),
        backgroundColor: "#3a3a3a",
        color: "#ffffff",
    },
    modalActions: {
        marginTop: rpx(28),
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    modalBtn: {
        paddingHorizontal: rpx(28),
        paddingVertical: rpx(16),
    },
});
