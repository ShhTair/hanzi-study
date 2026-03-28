const fs = require('fs');
let file = fs.readFileSync('app/lists/[level].tsx', 'utf8');

if (!file.includes('StudyTypePicker')) {
  file = file.replace(
    "import { PinyinText } from '../../src/components/PinyinText';",
    "import { PinyinText } from '../../src/components/PinyinText';\nimport { StudyTypePicker } from '../../src/components/StudyTypePicker';"
  );
  
  file = file.replace(
    "const [loading, setLoading] = useState(true);",
    "const [loading, setLoading] = useState(true);\n  const [pickerVisible, setPickerVisible] = useState(false);"
  );
  
  file = file.replace(
    "</View>\n  );\n}",
    `  <TouchableOpacity style={{ padding: 16, backgroundColor: Colors.primary, margin: 16, borderRadius: 8 }} onPress={() => setPickerVisible(true)}><Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>STUDY</Text></TouchableOpacity>
      <StudyTypePicker visible={pickerVisible} onClose={() => setPickerVisible(false)} level={level as string} setIndex={0} setName={\`HSK \${level}\`} />
    </View>
  );
}`
  );
}

fs.writeFileSync('app/lists/[level].tsx', file);
