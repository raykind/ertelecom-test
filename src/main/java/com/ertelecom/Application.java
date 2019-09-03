package com.ertelecom;
/*
 * @author Lev Ufimtsev
 * @version 02.09.2019 19:01
 */
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.ComponentScan;

@ComponentScan
@EnableAutoConfiguration
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}