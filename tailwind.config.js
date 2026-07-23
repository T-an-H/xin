/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: { center: true },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        brand: {
          950: '#1b2b3d',  // 最深深色 - 边框、强调
          900: '#0f5073',  // 最深主色调 - 标题、重要按钮、导航栏背景
          800: '#155ea0',  // 次主色 - 次要按钮、链接悬停、卡片边框
          750: '#3f6593',  // 菜单栏背景 - 导航栏普鲁士蓝
          700: '#2580c0',  // 中间调1 - 内容区域背景、图标填充
          600: '#429fc4',  // 中间调2 - 分割线、装饰性元素
          400: '#5eb6b9',  // 中间调3 - 图表数据点、标签、高亮
          200: '#80b8d7',  // 浅色1 - 大面积背景、表单输入框、浅色文字
          50:  '#bac9bd',  // 最浅色 - 页面主背景色
        },
      },
    },
  },
  plugins: [],
};