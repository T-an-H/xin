/**
 * 学生管理路由
 *
 * 供管理员查看和管理学生名单
 */
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * GET /api/students - 获取所有学生
 * 返回: { success, students }
 */
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, pageSize = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = '';
    const params = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR student_id LIKE ? OR class_name LIKE ?';
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    // 查总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM students ${whereClause}`,
      params
    );

    // 查列表
    const [rows] = await pool.execute(
      `SELECT id, student_id, name, phone, email, class_name, status, created_at
       FROM students ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    // 字段名映射：student_id → studentId, class_name → className
    const students = rows.map((s) => ({
      id: String(s.id),
      name: s.name,
      studentId: s.student_id,
      phone: s.phone,
      email: s.email,
      className: s.class_name,
      status: s.status,
      joinDate: s.created_at?.toISOString?.().split('T')[0] || s.created_at,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
    }));

    res.json({
      success: true,
      total: countRows[0].total,
      students,
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ success: false, message: '获取学生列表失败' });
  }
});

/**
 * GET /api/students/:id - 获取单个学生详情
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, student_id, name, phone, email, class_name, status, created_at FROM students WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }

    const s = rows[0];
    const student = {
      id: String(s.id),
      name: s.name,
      studentId: s.student_id,
      phone: s.phone,
      email: s.email,
      className: s.class_name,
      status: s.status,
      joinDate: s.created_at?.toISOString?.().split('T')[0] || s.created_at,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
    };

    res.json({ success: true, student });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({ success: false, message: '获取学生详情失败' });
  }
});

export default router;
