import snowflake from 'snowflake-sdk';

// Snowflake 연결 설정
const connectionConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT!,
  username: process.env.SNOWFLAKE_USERNAME!,
  password: process.env.SNOWFLAKE_PASSWORD!,
  database: process.env.SNOWFLAKE_DATABASE!,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
  role: process.env.SNOWFLAKE_ROLE!,
  schema: process.env.SNOWFLAKE_SCHEMA!,
};

// 연결 생성 함수
export async function getConnection(): Promise<snowflake.Connection> {
  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(connectionConfig);
    connection.connect((err, conn) => {
      if (err) {
        console.error('Snowflake 연결 실패:', err);
        reject(err);
      } else {
        resolve(conn);
      }
    });
  });
}

// 쿼리 실행 함수
export async function executeQuery<T>(sql: string): Promise<T[]> {
  const connection = await getConnection();

  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err, stmt, rows) => {
        connection.destroy((destroyErr) => {
          if (destroyErr) console.error('연결 종료 실패:', destroyErr);
        });

        if (err) {
          console.error('쿼리 실행 실패:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      }
    });
  });
}

// 안전한 쿼리 실행 (에러 시 빈 배열 반환)
export async function safeExecuteQuery<T>(sql: string): Promise<T[]> {
  try {
    return await executeQuery<T>(sql);
  } catch (error) {
    console.error('Query execution failed:', error);
    return [];
  }
}
