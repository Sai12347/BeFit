/*
# Diet Planner — Initial Schema (retry)

Creates the full database schema for a multi-user diet planner application.
See the detailed summary in the first attempt. This is a re-application after
a syntax error. Uses IF NOT EXISTS and DROP POLICY IF EXISTS for idempotency.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  age int,
  gender text DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  height_cm numeric,
  weight_kg numeric,
  activity_level text DEFAULT 'sedentary' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text DEFAULT 'maintain' CHECK (goal IN ('lose', 'maintain', 'gain')),
  dietary_preference text DEFAULT 'none' CHECK (dietary_preference IN ('none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo')),
  daily_calorie_goal int DEFAULT 2000,
  protein_goal int DEFAULT 150,
  carbs_goal int DEFAULT 200,
  fat_goal int DEFAULT 65,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- foods
-- ============================================================
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('fruits', 'vegetables', 'proteins', 'grains', 'dairy', 'snacks', 'beverages', 'other')),
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  serving_size text DEFAULT '1 serving',
  dietary_tags text[] DEFAULT '{}',
  is_custom boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_foods" ON foods;
CREATE POLICY "select_foods" ON foods FOR SELECT
  TO authenticated USING (is_custom = false OR user_id = auth.uid());

DROP POLICY IF EXISTS "insert_foods" ON foods;
CREATE POLICY "insert_foods" ON foods FOR INSERT
  TO authenticated WITH CHECK (is_custom = true AND user_id = auth.uid());

DROP POLICY IF EXISTS "update_foods" ON foods;
CREATE POLICY "update_foods" ON foods FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_foods" ON foods;
CREATE POLICY "delete_foods" ON foods FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- meals
-- ============================================================
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meals" ON meals;
CREATE POLICY "select_own_meals" ON meals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_meals" ON meals;
CREATE POLICY "insert_own_meals" ON meals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_meals" ON meals;
CREATE POLICY "update_own_meals" ON meals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_meals" ON meals;
CREATE POLICY "delete_own_meals" ON meals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- meal_items
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meal_items" ON meal_items;
CREATE POLICY "select_own_meal_items" ON meal_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_meal_items" ON meal_items;
CREATE POLICY "insert_own_meal_items" ON meal_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_meal_items" ON meal_items;
CREATE POLICY "update_own_meal_items" ON meal_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_meal_items" ON meal_items;
CREATE POLICY "delete_own_meal_items" ON meal_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  );

-- ============================================================
-- weight_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weight_logs" ON weight_logs;
CREATE POLICY "select_own_weight_logs" ON weight_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_weight_logs" ON weight_logs;
CREATE POLICY "insert_own_weight_logs" ON weight_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_weight_logs" ON weight_logs;
CREATE POLICY "update_own_weight_logs" ON weight_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_weight_logs" ON weight_logs;
CREATE POLICY "delete_own_weight_logs" ON weight_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- meal_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meal_templates" ON meal_templates;
CREATE POLICY "select_own_meal_templates" ON meal_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_meal_templates" ON meal_templates;
CREATE POLICY "insert_own_meal_templates" ON meal_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_meal_templates" ON meal_templates;
CREATE POLICY "update_own_meal_templates" ON meal_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_meal_templates" ON meal_templates;
CREATE POLICY "delete_own_meal_templates" ON meal_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- meal_template_items
-- ============================================================
CREATE TABLE IF NOT EXISTS meal_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meal_template_items" ON meal_template_items;
CREATE POLICY "select_own_meal_template_items" ON meal_template_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM meal_templates WHERE meal_templates.id = meal_template_items.template_id AND meal_templates.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_meal_template_items" ON meal_template_items;
CREATE POLICY "insert_own_meal_template_items" ON meal_template_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM meal_templates WHERE meal_templates.id = meal_template_items.template_id AND meal_templates.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_meal_template_items" ON meal_template_items;
CREATE POLICY "update_own_meal_template_items" ON meal_template_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM meal_templates WHERE meal_templates.id = meal_template_items.template_id AND meal_templates.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM meal_templates WHERE meal_templates.id = meal_template_items.template_id AND meal_templates.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_meal_template_items" ON meal_template_items;
CREATE POLICY "delete_own_meal_template_items" ON meal_template_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM meal_templates WHERE meal_templates.id = meal_template_items.template_id AND meal_templates.user_id = auth.uid())
  );

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_is_custom ON foods(is_custom);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_templates_user_id ON meal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_template_items_template_id ON meal_template_items(template_id);

-- ============================================================
-- Seed data: shared food catalog
-- ============================================================
INSERT INTO foods (name, category, calories, protein, carbs, fat, serving_size, dietary_tags, is_custom) VALUES
('Apple', 'fruits', 95, 0.5, 25, 0.3, '1 medium (182g)', '{vegetarian,vegan,gluten_free}', false),
('Banana', 'fruits', 105, 1.3, 27, 0.4, '1 medium (118g)', '{vegetarian,vegan,gluten_free}', false),
('Orange', 'fruits', 62, 1.2, 15.4, 0.2, '1 medium (131g)', '{vegetarian,vegan,gluten_free}', false),
('Strawberries', 'fruits', 49, 1, 11.7, 0.5, '1 cup (152g)', '{vegetarian,vegan,gluten_free}', false),
('Blueberries', 'fruits', 84, 1.1, 21, 0.5, '1 cup (148g)', '{vegetarian,vegan,gluten_free}', false),
('Grapes', 'fruits', 104, 1.1, 27.3, 0.2, '1 cup (151g)', '{vegetarian,vegan,gluten_free}', false),
('Mango', 'fruits', 99, 1.4, 24.7, 0.6, '1 cup (165g)', '{vegetarian,vegan,gluten_free}', false),
('Avocado', 'fruits', 234, 2.9, 12.5, 21.5, '1 medium (150g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Broccoli', 'vegetables', 55, 3.7, 11.2, 0.6, '1 cup (156g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Spinach', 'vegetables', 7, 0.9, 1.1, 0.1, '1 cup (30g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Carrots', 'vegetables', 50, 1.2, 11.7, 0.3, '1 cup (128g)', '{vegetarian,vegan,gluten_free,paleo}', false),
('Sweet Potato', 'vegetables', 112, 2, 26, 0.1, '1 medium (130g)', '{vegetarian,vegan,gluten_free,paleo}', false),
('Bell Pepper', 'vegetables', 37, 1.2, 7.2, 0.4, '1 medium (119g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Cucumber', 'vegetables', 16, 0.7, 3.6, 0.1, '1 cup (104g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Tomato', 'vegetables', 22, 1.1, 4.8, 0.2, '1 medium (123g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Kale', 'vegetables', 33, 2.9, 6.7, 0.5, '1 cup (67g)', '{vegetarian,vegan,gluten_free,keto,paleo}', false),
('Chicken Breast', 'proteins', 165, 31, 0, 3.6, '100g grilled', '{gluten_free,paleo,keto}', false),
('Salmon', 'proteins', 208, 20, 0, 13, '100g cooked', '{gluten_free,paleo,keto}', false),
('Eggs', 'proteins', 78, 6.3, 0.6, 5.3, '1 large (50g)', '{vegetarian,gluten_free,paleo,keto}', false),
('Lean Beef', 'proteins', 217, 26, 0, 12, '100g cooked', '{gluten_free,paleo,keto}', false),
('Tofu', 'proteins', 144, 17, 3, 9, '100g firm', '{vegetarian,vegan,gluten_free,paleo}', false),
('Shrimp', 'proteins', 99, 24, 0.2, 0.3, '100g cooked', '{gluten_free,paleo,keto}', false),
('Tuna (canned)', 'proteins', 116, 26, 0, 1, '100g', '{gluten_free,paleo,keto}', false),
('Greek Yogurt', 'proteins', 59, 10, 3.6, 0.4, '100g plain', '{vegetarian,gluten_free}', false),
('Turkey Breast', 'proteins', 135, 30, 0, 1, '100g', '{gluten_free,paleo,keto}', false),
('Lentils', 'proteins', 230, 18, 40, 0.8, '1 cup cooked (198g)', '{vegetarian,vegan,gluten_free,paleo}', false),
('Chickpeas', 'proteins', 269, 14.5, 45, 4.2, '1 cup cooked (164g)', '{vegetarian,vegan,gluten_free}', false),
('Brown Rice', 'grains', 216, 5, 45, 1.8, '1 cup cooked (195g)', '{vegetarian,vegan,gluten_free}', false),
('White Rice', 'grains', 205, 4.3, 45, 0.4, '1 cup cooked (158g)', '{vegetarian,vegan,gluten_free}', false),
('Oatmeal', 'grains', 158, 6, 27, 3, '1 cup cooked (234g)', '{vegetarian,vegan,gluten_free}', false),
('Whole Wheat Bread', 'grains', 81, 4, 14, 1.1, '1 slice (28g)', '{vegetarian,vegan}', false),
('Quinoa', 'grains', 222, 8, 39, 3.6, '1 cup cooked (185g)', '{vegetarian,vegan,gluten_free,paleo}', false),
('Pasta', 'grains', 221, 8, 43, 1.3, '1 cup cooked (140g)', '{vegetarian,vegan}', false),
('Milk (2%)', 'dairy', 122, 8, 12, 5, '1 cup (244g)', '{vegetarian,gluten_free}', false),
('Cheddar Cheese', 'dairy', 113, 7, 0.4, 9.3, '1 slice (28g)', '{vegetarian,gluten_free,keto}', false),
('Cottage Cheese', 'dairy', 206, 23, 6, 9, '1 cup (226g)', '{vegetarian,gluten_free}', false),
('Almond Milk', 'dairy', 39, 1, 1.5, 2.9, '1 cup (240ml)', '{vegetarian,vegan,gluten_free,paleo,keto}', false),
('Almonds', 'snacks', 164, 6, 6, 14, '28g (23 nuts)', '{vegetarian,vegan,gluten_free,paleo,keto}', false),
('Peanut Butter', 'snacks', 188, 8, 6, 16, '2 tbsp (32g)', '{vegetarian,vegan,gluten_free,paleo,keto}', false),
('Dark Chocolate', 'snacks', 170, 2, 13, 12, '30g', '{vegetarian,vegan,gluten_free}', false),
('Hummus', 'snacks', 70, 2, 6, 3.5, '2 tbsp (30g)', '{vegetarian,vegan,gluten_free,paleo}', false),
('Coffee (black)', 'beverages', 2, 0.3, 0, 0, '1 cup (240ml)', '{vegetarian,vegan,gluten_free,paleo,keto}', false),
('Green Tea', 'beverages', 2, 0, 0.5, 0, '1 cup (240ml)', '{vegetarian,vegan,gluten_free,paleo,keto}', false),
('Orange Juice', 'beverages', 112, 1.7, 26, 0.5, '1 cup (248ml)', '{vegetarian,vegan,gluten_free}', false)
ON CONFLICT DO NOTHING;