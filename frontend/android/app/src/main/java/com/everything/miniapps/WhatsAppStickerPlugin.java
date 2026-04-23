package com.everything.miniapps;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.activity.result.ActivityResult;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "WhatsAppSticker")
public class WhatsAppStickerPlugin extends Plugin {

    private static final String WHATSAPP_PACKAGE = "com.whatsapp";
    private static final String WHATSAPP_BUSINESS_PACKAGE = "com.whatsapp.w4b";
    private static final String ACTION_ENABLE_STICKER_PACK = "com.whatsapp.intent.action.ENABLE_STICKER_PACK";

    public WhatsAppStickerPlugin() {
        Log.d("WhatsAppSticker", "Plugin initialized and loaded!");
    }

    @PluginMethod
    public void addStickerPack(PluginCall call) {
        String identifier = "my_pack_id"; // Provider ile eslesmeli
        String name = call.getString("name", "Mini Apps Sticker");
        String base64Image = call.getString("stickerBase64");
        String trayIconBase64 = call.getString("trayIconBase64");

        if (base64Image == null) {
            call.reject("Sticker data is missing");
            return;
        }

        // 1. WhatsApp kontrolü
        boolean whatsappInstalled = isPackageInstalled(WHATSAPP_PACKAGE);
        boolean whatsappBusinessInstalled = isPackageInstalled(WHATSAPP_BUSINESS_PACKAGE);

        if (!whatsappInstalled && !whatsappBusinessInstalled) {
            call.reject("WhatsApp cihazda kurulu degil.");
            return;
        }

        // 2. Stickerlari kaydet (WhatsApp en az 3 tane istedigi icin ayni resmi 3 kez kaydediyoruz)
        try {
            saveSticker("sticker_0.webp", base64Image);
            saveSticker("sticker_1.webp", base64Image);
            saveSticker("sticker_2.webp", base64Image);
            
            if (trayIconBase64 != null) {
                saveSticker("tray_icon.png", trayIconBase64);
            } else {
                saveSticker("tray_icon.png", base64Image);
            }
        } catch (IOException e) {
            Log.e("WhatsAppSticker", "Error saving stickers", e);
            call.reject("Dosya kayit hatasi: " + e.getMessage());
            return;
        }

        // 3. Intent firlat
        try {
            Intent intent = new Intent();
            intent.setAction(ACTION_ENABLE_STICKER_PACK);
            intent.putExtra("sticker_pack_id", identifier);
            intent.putExtra("sticker_pack_authority", StickerContentProvider.AUTHORITY);
            intent.putExtra("sticker_pack_name", name);

            if (whatsappInstalled) {
                intent.setPackage(WHATSAPP_PACKAGE);
            } else {
                intent.setPackage(WHATSAPP_BUSINESS_PACKAGE);
            }

            startActivityForResult(call, intent, "handleStickerResult");

        } catch (Exception e) {
            Log.e("WhatsAppSticker", "Error launching WhatsApp", e);
            call.reject("WhatsApp baslatilamadi: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void handleStickerResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK) {
            call.resolve();
        } else {
            call.reject("Sticker paketi eklenmedi. Kod: " + result.getResultCode());
        }
    }

    private boolean isPackageInstalled(String packageName) {
        try {
            getContext().getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private void saveSticker(String fileName, String base64Data) throws IOException {
        String pureBase64 = base64Data.contains(",") ? base64Data.split(",")[1] : base64Data;
        byte[] decodedBytes = Base64.decode(pureBase64, Base64.DEFAULT);
        File dir = new File(getContext().getFilesDir(), "stickers");
        if (!dir.exists()) dir.mkdirs();
        File file = new File(dir, fileName);
        FileOutputStream fos = new FileOutputStream(file);
        fos.write(decodedBytes);
        fos.close();
    }
}
