import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql"
import mysql from "mysql2/promise"
import fs from "node:fs/promises"

export type DbHandle = {
    container: StartedMySqlContainer
    connection: mysql.Connection
}

export async function startMySql(image = "mysql:9") {
    const container = await new MySqlContainer(image)
        .withEnvironment({ MYSQL_DATABASE: "testdb" })
        .start()

    const connection = await mysql.createConnection({
        host: container.getHost(),
        port: container.getPort(),
        user: container.getUsername(),
        password: container.getUserPassword(),
        database: container.getDatabase(),
        multipleStatements: true
    })

    return { container, connection }
}

export async function stopMySql(db: DbHandle) {
    try {
        await db.connection.end()
    } catch {
    }
    try {
        await db.container.stop()
    } catch {
    }
}

export async function runSqlFile(connection: mysql.Connection, filePath: string) {
    const sql = await fs.readFile(filePath, "utf8")
    await connection.query(sql)
}

export async function runSql(connection: mysql.Connection, sql: string, params?: any[]) {
    return connection.query(sql, params)
}

export async function getColumn(
    connection: mysql.Connection,
    table: string,
    column: string
) {
    const [rows] = await connection.query(
        `SELECT DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [table, column]
    )
    return (rows as any[])[0]
}

export async function getTableColumns(conn: mysql.Connection, table: string) {
    const [rows] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [table]
    )
    return rows as any[]
}

export async function tableExists(conn: mysql.Connection, table: string) {
    const [rows] = await conn.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [table]
    )
    return (rows as any[]).length > 0
}

export async function fkExists(
    conn: mysql.Connection,
    table: string,
    constraintName: string
) {
    const [rows] = await conn.query(
        `SELECT CONSTRAINT_NAME
         FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND CONSTRAINT_NAME = ?
           AND TABLE_NAME = ?`,
        [constraintName, table]
    )
    return (rows as any[]).length > 0
}
