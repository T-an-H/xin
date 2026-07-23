/**
 * 种子脚本：向数据库插入测试学生数据
 *
 * 运行方式: npm run seed
 */
import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seed() {
  try {
    console.log('🌱 开始插入测试数据...');

    // 加密密码（所有测试账号密码统一为 "123456"）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 测试学生数据（与前端 mock 数据中的学生姓名匹配）
    const testStudents = [
      { student_id: 'S2024001', name: '张明', phone: '138****1234', email: 'zhangming@example.com', class_name: '计算机2101班' },
      { student_id: 'S2024002', name: '李华', phone: '139****5678', email: 'lihua@example.com', class_name: '计算机2101班' },
      { student_id: 'S2024003', name: '王芳', phone: '137****9012', email: 'wangfang@example.com', class_name: '软件工程2101班' },
      { student_id: 'S2024004', name: '赵磊', phone: '136****3456', email: 'zhaolei@example.com', class_name: '软件工程2101班' },
      { student_id: 'S2024005', name: '陈静', phone: '135****7890', email: 'chenjing@example.com', class_name: '数据科学2101班' },
    ];

    for (const s of testStudents) {
      await pool.execute(
        'INSERT IGNORE INTO students (student_id, name, password, phone, email, class_name) VALUES (?, ?, ?, ?, ?, ?)',
        [s.student_id, s.name, hashedPassword, s.phone, s.email, s.class_name]
      );
    }

    console.log(`✅ 成功插入 ${testStudents.length} 个测试学生账号`);
    console.log('📌 所有测试账号密码均为: 123456');
    console.log('📌 学号列表:', testStudents.map(s => s.student_id).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据插入失败:', error);
    process.exit(1);
  }
}

seed();
