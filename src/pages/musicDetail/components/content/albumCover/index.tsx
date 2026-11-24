import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import rpx from "@/utils/rpx";
import { ImgAsset } from "@/constants/assetsConst";
import FastImage from "@/components/base/fastImage";
import useOrientation from "@/hooks/useOrientation";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useCurrentMusic, useMusicState } from "@/core/trackPlayer";
import { musicIsPaused } from "@/utils/trackUtils";
import Operations from "./operations";
import { showPanel } from "@/components/panels/usePanel.ts";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { useCurrentLyricItem } from "@/core/lyricManager";
import { useI18N } from "@/core/i18n";
import PersistStatus from "@/utils/persistStatus";
import useColors from "@/hooks/useColors";

interface IProps {
    onTurnPageClick?: () => void;
}

const ROTATE_DURATION = 24000;

/** 与全屏歌词字号档位保持一致 */
const lyricFontSizeMap = {
    0: rpx(28),
    1: rpx(34),
    2: rpx(40),
    3: rpx(46),
    4: rpx(52),
    5: rpx(58),
} as Record<number, number>;
const MAX_LYRIC_FONT_SIZE_KEY = 5;

export default function AlbumCover(props: IProps) {
    const { onTurnPageClick } = props;

    const musicItem = useCurrentMusic();
    const orientation = useOrientation();
    const musicState = useMusicState();
    const currentLyricItem = useCurrentLyricItem();
    const { t } = useI18N();
    const colors = useColors();
    const isPlaying = !musicIsPaused(musicState);
    const fontSizeKey = PersistStatus.useValue("lyric.detailFontSize", 1);
    const highlightFontSize = useMemo(() => {
        const key = Math.min((fontSizeKey ?? 1) + 2, MAX_LYRIC_FONT_SIZE_KEY);
        return lyricFontSizeMap[key] ?? lyricFontSizeMap[3];
    }, [fontSizeKey]);

    const coverSize = orientation === "vertical" ? rpx(520) : rpx(260);
    const artworkStyle = useMemo(
        () => ({
            width: coverSize,
            height: coverSize,
            borderRadius: coverSize / 2,
        }),
        [coverSize],
    );

    const rotation = useSharedValue(0);
    const musicKey = `${musicItem?.platform ?? ""}-${musicItem?.id ?? ""}`;

    useEffect(() => {
        cancelAnimation(rotation);
        rotation.value = 0;
    }, [musicKey, rotation]);

    useEffect(() => {
        if (isPlaying) {
            const current = rotation.value % 360;
            rotation.value = current;
            rotation.value = withRepeat(
                withTiming(current + 360, {
                    duration: ROTATE_DURATION,
                    easing: Easing.linear,
                }),
                -1,
                false,
            );
        } else {
            cancelAnimation(rotation);
        }

        return () => {
            cancelAnimation(rotation);
        };
    }, [isPlaying, musicKey, rotation]);

    const rotateStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const longPress = Gesture.LongPress()
        .minDuration(350)
        .onStart(() => {
            if (musicItem?.artwork) {
                showPanel("ImageViewer", {
                    url: musicItem.artwork,
                });
            }
        })
        .runOnJS(true);

    const tap = Gesture.Tap()
        .onStart(() => {
            onTurnPageClick?.();
        })
        .runOnJS(true);

    const combineGesture = Gesture.Exclusive(longPress, tap);

    const lyricText =
        currentLyricItem?.lrc?.trim() ||
        musicItem?.title ||
        t("lyric.noLyric");

    return (
        <View style={styles.container}>
            <View style={styles.coverArea}>
                <GestureDetector gesture={combineGesture}>
                    <View style={[styles.coverShadow, artworkStyle]}>
                        <Animated.View
                            style={[
                                styles.coverClip,
                                artworkStyle,
                                rotateStyle,
                            ]}>
                            <FastImage
                                style={artworkStyle}
                                source={musicItem?.artwork}
                                placeholderSource={ImgAsset.albumDefault}
                            />
                        </Animated.View>
                    </View>
                </GestureDetector>
            </View>
            <Pressable
                style={styles.lyricRow}
                onPress={() => onTurnPageClick?.()}>
                <Text
                    style={[
                        styles.lyricText,
                        {
                            fontSize: highlightFontSize,
                            lineHeight: highlightFontSize * 1.45,
                            color: colors.primary,
                        },
                    ]}
                    numberOfLines={1}>
                    {lyricText}
                </Text>
            </Pressable>
            <Operations />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flex: 1,
        justifyContent: "center",
    },
    coverArea: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    coverShadow: {
        backgroundColor: "rgba(255,255,255,0.06)",
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    coverClip: {
        overflow: "hidden",
    },
    lyricRow: {
        width: "100%",
        paddingHorizontal: rpx(48),
        marginBottom: rpx(28),
        minHeight: rpx(48),
        justifyContent: "center",
    },
    lyricText: {
        opacity: 1,
        fontWeight: "600",
        textAlign: "left",
        includeFontPadding: false,
    },
});
