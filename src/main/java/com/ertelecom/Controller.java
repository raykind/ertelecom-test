package com.ertelecom;
/*
 * @author Lev Ufimtsev
 * @version 02.09.2019 19:01
 */
import org.json.simple.parser.ParseException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.URL;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

@RestController
public class Controller {
  @GetMapping(value="/getSmth", produces=MediaType.APPLICATION_JSON_VALUE)
  public String getWidgetList(/*@RequestParam(value="count") Integer count,
                                    @RequestParam(value="page") Integer page*/){
    return "123";
  }

  @PostMapping(value="/addSmth", produces=MediaType.APPLICATION_JSON_VALUE)
  public String addWidget(){
    JSONParser jsonParser = new JSONParser();
    File initialFile = new File("src/main/resources/json/channels.json");

    try (FileReader reader = new FileReader(initialFile))
    {
      Object obj = jsonParser.parse(reader);
      JSONObject jsonObject = (JSONObject) obj;

      return jsonObject.toJSONString();
    } catch (FileNotFoundException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    } catch (ParseException e) {
      e.printStackTrace();
    };
    return "{\"error\": true}";
  }
}