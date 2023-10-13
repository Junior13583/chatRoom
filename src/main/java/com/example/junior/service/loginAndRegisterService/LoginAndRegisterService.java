package com.example.junior.service.loginAndRegisterService;

import com.example.junior.vo.ResponseDataVO;

/**
* @Description: 登录和注册服务接口
* @Author: Junior
* @Date: 2023/10/13
*/
public interface LoginAndRegisterService {

    /**
    * 登录接口
    * @param email:  用户邮箱
	* @param password:  用户密码，密码长度限制 1-6
    * @return: com.example.junior.vo.ResponseDataVO
    * @Author: Junior
    * @Date: 2023/10/13
    */
    ResponseDataVO login(String email, String password);

    /**
    * 注册接口
    * @param name:  用户名
	* @param email:  用户邮箱
	* @param password:  用户密码，密码长度限制 1-6
    * @return: com.example.junior.vo.ResponseDataVO
    * @Author: Junior
    * @Date: 2023/10/13
    */
    ResponseDataVO register(String name, String email, String password);
}