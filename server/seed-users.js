/**
 * 种子脚本：向 users 表插入所有账号（管理员/教师/导师/领导/学生）
 * 所有账号密码均为 666666
 *
 * 运行方式: node seed-users.js
 */
import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seedUsers() {
  try {
    console.log('🌱 开始插入统一账号数据...');

    // 先清空 users 表
    await pool.execute('TRUNCATE TABLE users');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('666666', salt);

    // ====== 所有账号列表 ======

    const users = [
      // --- 管理员 ---
      { account: 'admin', name: '管理员', role: 'admin', sub_role: null },

      // --- 授课导师 ---
      { account: 'teacher-wang', name: '王老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-li', name: '李老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-chen', name: '陈老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-zhang', name: '张老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-liu', name: '刘老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-zhao', name: '赵老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-sun', name: '孙老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-zhou', name: '周老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-qian', name: '钱老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-wu', name: '吴老师', role: 'teacher', sub_role: 'teacher' },
      { account: 'teacher-zheng', name: '郑老师', role: 'teacher', sub_role: 'teacher' },

      // --- 企业导师 ---
      { account: 'mentor-zhang', name: '张导师', role: 'teacher', sub_role: 'mentor' },
      { account: 'mentor-li', name: '李导师', role: 'teacher', sub_role: 'mentor' },

      // --- 学院领导 ---
      { account: 'leader-liu', name: '刘院长', role: 'teacher', sub_role: 'leader' },
      { account: 'leader-chen', name: '陈院长', role: 'teacher', sub_role: 'leader' },

      // --- 学生（24 个 mock 学生 + 李傲天） ---
      { account: 'S2024001', name: '张明', role: 'student', sub_role: null },
      { account: 'S2024002', name: '李华', role: 'student', sub_role: null },
      { account: 'S2024003', name: '王芳', role: 'student', sub_role: null },
      { account: 'S2024004', name: '赵磊', role: 'student', sub_role: null },
      { account: 'S2024005', name: '陈静', role: 'student', sub_role: null },
      { account: 'S2024006', name: '刘洋', role: 'student', sub_role: null },
      { account: 'S2024007', name: '孙丽', role: 'student', sub_role: null },
      { account: 'S2024008', name: '周杰', role: 'student', sub_role: null },
      { account: 'S2024009', name: '吴婷', role: 'student', sub_role: null },
      { account: 'S2024010', name: '郑凯', role: 'student', sub_role: null },
      { account: 'S2024011', name: '黄丽', role: 'student', sub_role: null },
      { account: 'S2024012', name: '林伟', role: 'student', sub_role: null },
      { account: 'S2024013', name: '何雪', role: 'student', sub_role: null },
      { account: 'S2024014', name: '马强', role: 'student', sub_role: null },
      { account: 'S2024015', name: '胡敏', role: 'student', sub_role: null },
      { account: 'S2024016', name: '高飞', role: 'student', sub_role: null },
      { account: 'S2024017', name: '欧阳雪', role: 'student', sub_role: null },
      { account: 'S2024018', name: '慕容枫', role: 'student', sub_role: null },
      { account: 'S2024019', name: '令狐冲', role: 'student', sub_role: null },
      { account: 'S2024020', name: '杨过', role: 'student', sub_role: null },
      { account: 'S2024021', name: '小龙女', role: 'student', sub_role: null },
      { account: 'S2024022', name: '独孤求败', role: 'student', sub_role: null },
      { account: 'S2024023', name: '韦小宝', role: 'student', sub_role: null },
      { account: 'S2024024', name: '乔峰', role: 'student', sub_role: null },
      { account: '202511053250', name: '李傲天', role: 'student', sub_role: null },
    ];

    // 批量插入
    const sql = 'INSERT INTO users (account, password, name, role, sub_role) VALUES (?, ?, ?, ?, ?)';
    for (const u of users) {
      await pool.execute(sql, [u.account, hashedPassword, u.name, u.role, u.sub_role]);
    }

    console.log(`✅ 成功插入 ${users.length} 个账号！`);
    console.log(`📌 所有账号的密码均为: 666666`);
    console.log('');
    console.log('📋 账号清单：');
    console.log(`   管理员: admin`);
    console.log(`   授课导师: teacher-wang ~ teacher-zheng（${11}人）`);
    console.log(`   企业导师: mentor-zhang, mentor-li`);
    console.log(`   学院领导: leader-liu, leader-chen`);
    console.log(`   学生: S2024001 ~ S2024024 + 李傲天（${25}人）`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 插入失败:', error);
    process.exit(1);
  }
}

seedUsers();
