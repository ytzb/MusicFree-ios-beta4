import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import rpx from "@/utils/rpx";
import ThemeText from "@/components/base/themeText";
import useTextColor from "@/hooks/useTextColor";
import Checkbox from "@/components/base/checkbox";
import { TouchableOpacity } from "react-native-gesture-handler";
import Icon from "@/components/base/icon.tsx";
import { iconSizeConst } from "@/constants/uiConst.ts";

const ITEM_HEIGHT = rpx(96);

interface IProps {
    type: "folder" | "file";
    path: string;
    parentPath: string;
    checked?: boolean;
    /** 是否显示「进入」箭头（选文件夹模式下用） */
    showEnter?: boolean;
    onItemPress: (currentChecked?: boolean) => void;
    onCheckedChange: (checked: boolean) => void;
    onEnterPress?: () => void;
}
function FileItem(props: IProps) {
    const {
        type,
        path,
        parentPath,
        checked,
        showEnter,
        onItemPress,
        onCheckedChange: onCheckChange,
        onEnterPress,
    } = props;

    const textColor = useTextColor();

    const displayName = path.substring(
        parentPath === "/" ? 1 : parentPath.length + 1,
    );

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => {
                    onItemPress(checked);
                }}
                style={styles.pathWrapper}>
                <Icon
                    name={type === "folder" ? "folder-outline" : "document-outline"}
                    color={textColor}
                    style={styles.folderIcon}
                    size={iconSizeConst.light}
                />
                <ThemeText
                    style={styles.path}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {displayName}
                </ThemeText>
            </Pressable>
            {showEnter ? (
                <TouchableOpacity
                    onPress={onEnterPress}
                    style={styles.checkIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon
                        name="arrow-right-end-on-rectangle"
                        color={textColor}
                        size={iconSizeConst.light}
                    />
                </TouchableOpacity>
            ) : null}
            <TouchableOpacity
                onPress={() => {
                    onCheckChange(!checked);
                }}
                style={styles.checkIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Checkbox checked={checked} />
            </TouchableOpacity>
        </View>
    );
}

export default memo(
    FileItem,
    (prev, curr) =>
        prev.checked === curr.checked &&
        prev.parentPath === curr.parentPath &&
        prev.path === curr.path &&
        prev.showEnter === curr.showEnter,
);

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: ITEM_HEIGHT,
        paddingHorizontal: rpx(24),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    folderIcon: {
        fontSize: rpx(32),
        marginRight: rpx(14),
    },
    pathWrapper: {
        flexDirection: "row",
        flex: 1,
        alignItems: "center",
        height: "100%",
        marginRight: rpx(12),
    },
    path: {
        height: "100%",
        lineHeight: ITEM_HEIGHT,
    },
    checkIcon: {
        padding: rpx(14),
    },
});
