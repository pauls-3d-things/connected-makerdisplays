// either use the fork from https://github.com/pauls-3d-things/Maker_LED_Matrix_32, until fixed upstream
// or the latest from https://github.com/e-radionicacom/Maker_LED_Matrix_32
#include "Maker_LED_Matrix_32.h" 
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h> // IMPORTANT: v6!

Maker_LED_Matrix_32 led;
const char* SSID = "<YOUR SSID HERE>";
const char* PASSWORD = "<YOUR PASS HERE>";
const char* SERVER = "http://<YOUR SERVER IP HERE>:4444/balls";

uint16_t offsetX = 0;
uint16_t offsetY = 0;

boolean registered = false;

void setup() {
  Serial.begin(9600);

  if (!led.begin()) {
    Serial.println("Display fail!");
    while (true); {
      delay(1);
    }
  }

  led.brightness(32, 0);

  led.message("Pixel v0.1", 100, 1, 2);
  delay(6 * 1000);

  led.deleteScroll();
  delay(1000);
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);

  delay(1000);
  while (WiFi.status() != WL_CONNECTED); {

    uint8_t tries = 10;
    while (tries-- && WiFi.status() != WL_CONNECTED) {
      led.deleteScroll();
      led.message(".:.:.", 100, 1, 0);
      delay(500);
      led.deleteScroll();
      led.message(":.:.:", 100, 1, 0);
      delay(500);
    }

    if (WiFi.status() != WL_CONNECTED) {
      led.deleteScroll();
      led.message("no con.", 100, 1, 0);
      delay(1000);
      while (1) {}
    }
  }

  led.deleteScroll();
}

void loop() {
  if (!registered) {
    delay(500);
    // register as new display
    // data: {"offsetX":0,"offsetY":27}
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://mrbook:4444/register");
      int httpCode = http.GET();
      //Check the returning code
      if (httpCode > 0) {
        const size_t bufferSize = 512;
        DynamicJsonDocument doc(bufferSize);

        deserializeJson(doc, http.getString());
        JsonObject conf = doc.as<JsonObject>();
        offsetX = conf["offsetX"];
        offsetY = conf["offsetY"];

        Serial.print("offset x: ");
        Serial.print(offsetX);
        Serial.print(" offset y: ");
        Serial.println(offsetY);
        Serial.println();

      }
      http.end();   //Close connection
      registered = true;
    }
  }

  // data: [{"x":0,"y":0}]
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER);
    int httpCode = http.GET();
    //Check the returning code
    if (httpCode > 0) {
      const size_t bufferSize = 512;
      DynamicJsonDocument doc(bufferSize);

      deserializeJson(doc, http.getString());
      JsonArray balls = doc.as<JsonArray>();

      led.deleteScroll();
      delay(50);

      for (JsonObject ball : balls) {
        uint16_t x = ball["x"];
        uint16_t y = ball["y"];
        // check if we need to draw and remap ball
        if (x >= offsetX && x < offsetX + 32 &&
            y >= offsetY && y < offsetY + 9 ) {
          led.setPixel(x - offsetX, y - offsetY, 32);
        }

        //in case you want to debug :)
        //Serial.print("x: ");
        //Serial.print(x);
        //Serial.print(" y: ");
        //Serial.println(y);
        //Serial.println();
      }

    }
    http.end();   //Close connection
  }


  led.updateDisplay();
  delay(50);
}
