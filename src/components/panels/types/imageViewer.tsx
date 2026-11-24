import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import rpx, { vh, vw } from "@/utils/rpx";
import Toast from "@/utils/toast";
import useOrientation from "@/hooks/useOrientation.ts";
import {
    normalizeImageSource,
    saveToGallery,
} from "@/utils/fileUtils.ts";
import { errorLog } from "@/utils/log.ts";
import PanelFullscreen from "@/components/panels/base/panelFullscreen.tsx";
import { Button } from "@/components/base/button.tsx";
import { useI18N } from "@/core/i18n";
import { hidePanel } from "@/components/panels/usePanel";
import FastImage from "@/components/base/fastImage";
import { ImgAsset } from "@/constants/assetsConst";

interface IImageViewerProps {
    // 图片路径（网络 URL / 本地路径 / 资源 id）
    url: string | number;
}

export default function ImageViewer(props: IImageViewerProps) {
    const { url } = props;
    const orientation = useOrientation();
    const { t } = useI18N();
    const [saving, setSaving] = useState(false);

    const imageSource = useMemo(
        () => normalizeImageSource(url) ?? ImgAsset.albumDefault,
        [url],
    );

    const onSave = useCallback(async () => {
        if (url === undefined || url === null || url === "" || saving) {
            return;
        }
        setSaving(true);
        try {
            const resultPath = await saveToGallery(url);
            Toast.success(
                t("panel.imageViewer.saveImageSuccess", {
                    path: resultPath,
                }),
            );
            hidePanel();
        } catch (e: any) {
            const reason = String(e?.message ?? e ?? "");
            if (/did not share|cancel|cancelled|canceled/i.test(reason)) {
                return;
            }
            errorLog("Save failed", reason);
            Toast.warn(
                t("panel.imageViewer.saveImageFail", {
                    reason,
                }),
            );
        } finally {
            setSaving(false);
        }
    }, [saving, t, url]);

    return (
        <PanelFullscreen
            hasMask
            animationType="Scale"
            containerStyle={styles.container}>
            <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
                <View style={styles.imageWrap}>
                    <FastImage
                        style={
                            orientation === "vertical"
                                ? styles.imageVertical
                                : styles.imageHorizontal
                        }
                        source={imageSource}
                        placeholderSource={ImgAsset.albumDefault}
                        defaultSource={ImgAsset.albumDefault}
                    />
                </View>
                <Button
                    text={
                        saving
                            ? t("panel.imageViewer.savingImage")
                            : t("panel.imageViewer.saveImage")
                    }
                    type="primary"
                    style={styles.button}
                    onPress={onSave}
                />
                {saving ? (
                    <ActivityIndicator
                        style={styles.loading}
                        color="#ffffff"
                    />
                ) : null}
            </Pressable>
        </PanelFullscreen>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: rpx(40),
        paddingHorizontal: rpx(24),
        zIndex: 2,
    },
    imageWrap: {
        width: "100%",
        minHeight: vh(40),
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.25)",
        borderRadius: rpx(12),
        overflow: "hidden",
    },
    imageVertical: {
        width: vw(92),
        height: vw(92),
        maxHeight: vh(62),
        borderRadius: rpx(12),
    },
    imageHorizontal: {
        width: vh(56),
        height: vh(56),
        maxWidth: vw(70),
        borderRadius: rpx(12),
    },
    button: {
        minWidth: rpx(320),
        paddingHorizontal: rpx(64),
        zIndex: 2,
    },
    loading: {
        position: "absolute",
        bottom: rpx(160),
    },
});
