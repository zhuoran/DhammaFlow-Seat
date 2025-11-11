"use client";

import { Layout } from "antd";
import { PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import styles from "./app-shell.module.css";

const { Content } = Layout;

export function AppShell({ children }: PropsWithChildren) {
  return (
    <Layout className={styles.root}>
      <Sidebar />
      <Layout className={styles.inner}>
        <TopBar />
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
