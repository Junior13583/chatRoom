package com.example.junior.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.websocket.HandshakeResponse;
import javax.websocket.server.HandshakeRequest;
import javax.websocket.server.ServerEndpointConfig;
import java.util.Enumeration;
import java.util.Map;


/**
* @Description: websocket配置类，加入用户ip
* @Author: Junior
* @Date: 2023/6/10
*/
@Configuration
public class WebSocketConfigurator extends ServerEndpointConfig.Configurator {
    public static final String HTTP_SESSION_ID_ATTR_NAME = "HTTP.SESSION.ID";

    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }

}
