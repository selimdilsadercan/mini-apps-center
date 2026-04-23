package com.everything.miniapps;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.File;
import java.io.FileNotFoundException;

public class StickerContentProvider extends ContentProvider {
    public static final String AUTHORITY = "com.everything.miniapps.stickercontentprovider";

    // WhatsApp'in beklediği sütun isimleri — DEGISTIRME
    private static final String STICKER_PACK_IDENTIFIER_IN_QUERY = "sticker_pack_identifier";
    private static final String STICKER_PACK_NAME_IN_QUERY = "sticker_pack_name";
    private static final String STICKER_PACK_PUBLISHER_IN_QUERY = "sticker_pack_publisher";
    private static final String STICKER_PACK_ICON_IN_QUERY = "sticker_pack_icon"; // tray_icon degil!
    private static final String ANDROID_APP_DOWNLOAD_LINK_IN_QUERY = "android_play_store_link";
    private static final String IOS_APP_DOWNLOAD_LINK_IN_QUERY = "ios_app_download_link"; // store_link degil!
    private static final String PUBLISHER_EMAIL = "sticker_pack_publisher_email";
    private static final String PUBLISHER_WEBSITE = "sticker_pack_publisher_website";
    private static final String PRIVACY_POLICY_WEBSITE = "sticker_pack_privacy_policy_website"; // url degil!
    private static final String LICENSE_AGREEMENT_WEBSITE = "sticker_pack_license_agreement_website"; // url degil!
    private static final String IMAGE_DATA_VERSION = "image_data_version";
    private static final String AVOID_CACHE = "whatsapp_will_not_cache_stickers"; // avoid_cache degil!
    private static final String ANIMATED_STICKER_PACK = "animated_sticker_pack"; // bu da eksikti!

    private static final String STICKER_FILE_NAME_IN_QUERY = "sticker_file_name";
    private static final String STICKER_FILE_EMOJI_IN_QUERY = "sticker_emoji";
    private static final String STICKER_FILE_ACCESSIBILITY_TEXT_IN_QUERY = "sticker_accessibility_text";

    private static final String METADATA = "metadata";
    private static final String STICKERS = "stickers";
    private static final String STICKERS_ASSET = "stickers_asset";

    private static final int METADATA_CODE = 1;
    private static final int METADATA_CODE_FOR_SINGLE_PACK = 2;
    private static final int STICKERS_CODE = 3;
    private static final int STICKERS_ASSET_CODE = 4;
    private static final int STICKER_PACK_TRAY_ICON_CODE = 5;

    private static final UriMatcher MATCHER = new UriMatcher(UriMatcher.NO_MATCH);

    @Override
    public boolean onCreate() {
        MATCHER.addURI(AUTHORITY, METADATA, METADATA_CODE);
        MATCHER.addURI(AUTHORITY, METADATA + "/*", METADATA_CODE_FOR_SINGLE_PACK);
        MATCHER.addURI(AUTHORITY, STICKERS + "/*", STICKERS_CODE);
        // Her sticker dosyası için spesifik URI kaydi
        MATCHER.addURI(AUTHORITY, STICKERS_ASSET + "/my_pack_id/tray_icon.png", STICKER_PACK_TRAY_ICON_CODE);
        MATCHER.addURI(AUTHORITY, STICKERS_ASSET + "/my_pack_id/sticker_0.webp", STICKERS_ASSET_CODE);
        MATCHER.addURI(AUTHORITY, STICKERS_ASSET + "/my_pack_id/sticker_1.webp", STICKERS_ASSET_CODE);
        MATCHER.addURI(AUTHORITY, STICKERS_ASSET + "/my_pack_id/sticker_2.webp", STICKERS_ASSET_CODE);
        return true;
    }

    @Nullable
    @Override
    public Cursor query(@NonNull Uri uri, @Nullable String[] projection, @Nullable String selection, @Nullable String[] selectionArgs, @Nullable String sortOrder) {
        final int code = MATCHER.match(uri);
        Log.d("StickerProvider", "Query URI: " + uri + " code: " + code);

        if (code == METADATA_CODE) {
            return getPackListCursor(uri);
        } else if (code == METADATA_CODE_FOR_SINGLE_PACK) {
            return getPackListCursor(uri);
        } else if (code == STICKERS_CODE) {
            return getStickerListCursor(uri);
        }
        return null;
    }

    private Cursor getPackListCursor(Uri uri) {
        MatrixCursor cursor = new MatrixCursor(new String[]{
                STICKER_PACK_IDENTIFIER_IN_QUERY,
                STICKER_PACK_NAME_IN_QUERY,
                STICKER_PACK_PUBLISHER_IN_QUERY,
                STICKER_PACK_ICON_IN_QUERY,
                ANDROID_APP_DOWNLOAD_LINK_IN_QUERY,
                IOS_APP_DOWNLOAD_LINK_IN_QUERY,
                PUBLISHER_EMAIL,
                PUBLISHER_WEBSITE,
                PRIVACY_POLICY_WEBSITE,
                LICENSE_AGREEMENT_WEBSITE,
                IMAGE_DATA_VERSION,
                AVOID_CACHE,
                ANIMATED_STICKER_PACK
        });

        cursor.addRow(new Object[]{
                "my_pack_id",
                "Mini Apps Sticker",
                "Mini Apps Center",
                "tray_icon.png",
                "",
                "",
                "",
                "https://everything.com",
                "https://everything.com/privacy",
                "https://everything.com/license",
                "1",
                0, // avoid_cache: Integer
                0  // animated: Integer (0 = false)
        });

        if (getContext() != null) {
            cursor.setNotificationUri(getContext().getContentResolver(), uri);
        }
        return cursor;
    }

    private Cursor getStickerListCursor(Uri uri) {
        MatrixCursor cursor = new MatrixCursor(new String[]{
                STICKER_FILE_NAME_IN_QUERY,
                STICKER_FILE_EMOJI_IN_QUERY,
                STICKER_FILE_ACCESSIBILITY_TEXT_IN_QUERY
        });

        cursor.addRow(new Object[]{"sticker_0.webp", "😊", ""});
        cursor.addRow(new Object[]{"sticker_1.webp", "🚀", ""});
        cursor.addRow(new Object[]{"sticker_2.webp", "🔥", ""});

        if (getContext() != null) {
            cursor.setNotificationUri(getContext().getContentResolver(), uri);
        }
        return cursor;
    }

    @Nullable
    @Override
    public AssetFileDescriptor openAssetFile(@NonNull Uri uri, @NonNull String mode) throws FileNotFoundException {
        final int matchCode = MATCHER.match(uri);
        Log.d("StickerProvider", "openAssetFile URI: " + uri + " code: " + matchCode);

        if (matchCode == STICKERS_ASSET_CODE || matchCode == STICKER_PACK_TRAY_ICON_CODE) {
            String fileName = uri.getLastPathSegment();
            File file = new File(getContext().getFilesDir(), "stickers/" + fileName);
            Log.d("StickerProvider", "Opening: " + file.getAbsolutePath() + " exists: " + file.exists());
            if (file.exists()) {
                ParcelFileDescriptor pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
                return new AssetFileDescriptor(pfd, 0, AssetFileDescriptor.UNKNOWN_LENGTH);
            }
            throw new FileNotFoundException("File not found: " + fileName);
        }
        return null;
    }

    @Nullable
    @Override
    public String getType(@NonNull Uri uri) {
        final int code = MATCHER.match(uri);
        switch (code) {
            case METADATA_CODE:
                return "vnd.android.cursor.dir/vnd." + AUTHORITY + ".metadata";
            case METADATA_CODE_FOR_SINGLE_PACK:
                return "vnd.android.cursor.item/vnd." + AUTHORITY + ".metadata";
            case STICKERS_CODE:
                return "vnd.android.cursor.dir/vnd." + AUTHORITY + ".stickers";
            case STICKERS_ASSET_CODE:
                return "image/webp";
            case STICKER_PACK_TRAY_ICON_CODE:
                return "image/png";
            default:
                return null;
        }
    }

    @Nullable
    @Override
    public Uri insert(@NonNull Uri uri, @Nullable ContentValues values) {
        return null;
    }

    @Override
    public int delete(@NonNull Uri uri, @Nullable String selection, @Nullable String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(@NonNull Uri uri, @Nullable ContentValues values, @Nullable String selection, @Nullable String[] selectionArgs) {
        return 0;
    }
}
