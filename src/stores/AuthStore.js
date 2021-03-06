// @flow
import { observable, action } from "mobx";
import axios from "axios";
import Cookie from "js-cookie";
import url from "url";

import config from "../config.js";
import { User } from "../models";
import type { RootStore } from "./";

export class AuthStore {
  @observable
  account: User;

  @observable
  loading: boolean = false;

  @observable
  authToken: string = "";

  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  @action
  updateAuthenticationStatus(): void {
    if (!this.authToken) {
      this.authToken = Cookie.get("auth-token");
    }
  }

  @action
  async signUp(email: string, password: string): Promise<User> {
    this.loading = true;

    try {
      const response = await axios.post(
        url.format({
          ...config.api,
          pathname: "/registration"
        }),
        {
          email,
          password
        },
        {
          headers: {}
        }
      );

      this.loading = false;
      return new User(response.data);
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  @action
  async login(email: string, password: string): Promise<User> {
    this.loading = true;

    try {
      const response = await axios.post(
        url.format({
          ...config.api,
          pathname: "/login"
        }),
        {
          email,
          password
        },
        {
          headers: {}
        }
      );

      Cookie.set("auth-token", response.data.token);
      this.account = new User(response.data.user);
      this.loading = false;
      return this.account;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  @action
  async activate(token: String): Promise<User> {
    this.loading = true;

    try {
      const response = await axios.post(
        url.format({
          ...config.api,
          pathname: "/activation"
        }),
        { token },
        {
          headers: {}
        }
      );

      Cookie.set("auth-token", response.data.token);
      this.account = new User(response.data.user);
      this.loading = false;
      return this.account;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  @action
  logout(): void {
    Cookie.remove("auth-token");
    this.authToken = "";
  }

  @action
  async loadAccount(): Promise<User> {
    this.loading = true;

    try {
      const response = await axios.get(
        url.format({
          ...config.api,
          pathname: "/profile"
        }),
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        }
      );

      this.account = new User(response.data);
      this.loading = false;
      return this.account;
    } catch (error) {
      this.logout();
      this.loading = false;
      throw error;
    }
  }

  @action
  async reset_password(email: string): Promise<void> {
    this.loading = true;

    try {
      await axios.post(
        url.format({
          ...config.api,
          pathname: "/reset_password"
        }),
        {
          email
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        }
      );

      this.loading = false;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  @action
  async change_password(token: string, password: string): Promise<void> {
    this.loading = true;

    try {
      const response = await axios.post(
        url.format({
          ...config.api,
          pathname: "/change_password"
        }),
        {
          token,
          password
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        }
      );

      Cookie.set("auth-token", response.data.token);
      this.account = new User(response.data.user);
      this.loading = false;
      return this.account;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }

  @action
  async delete(): Promise<boolean> {
    this.loading = true;

    try {
      await axios.delete(
        url.format({
          ...config.api,
          pathname: `/users/${this.account.id}`
        }),
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        }
      );

      this.logout();
      this.loading = false;
      return true;
    } catch (error) {
      this.loading = false;
      throw error;
    }
  }
}
