【强制】   需严格执行

【推荐】   强烈建议执行

【参考】   在不影响业务使用情况下，强烈推荐

核心原则
原则一：代码应该简洁易懂，逻辑清晰
因为软件是需要人来维护的。这个人在未来很可能不是你。所以首先是为人编写程序，其次才是计算机：

不要过分追求技巧，降低程序的可读性。

简洁的代码可以让bug无处藏身。要写出明显没有bug的代码，而不是没有明显bug的代码。

原则二：面向变化编程，而不是面向需求编程。
需求是暂时的，只有变化才是永恒的。

本次迭代不能仅仅为了当前的需求，写出扩展性强，易修改的程序才是负责任的做法，对自己负责，对公司负责。

原则三：先保证程序的正确性，防止过度工程
过度工程（over-engineering）：在正确可用的代码写出之前就过度地考虑扩展，重用的问题，使得工程过度复杂。

 

一、编程规约
(一)命名风格
【强制】代码中的命名均不能以下划线或美元符号开始，也不能以下划线或美元符号结束。

反例：_name / __name / $name / name_ / name$ / name__

【强制】所有编程相关的命名严禁使用拼音与英文混合的方式，更不允许直接使用中文的方式。

说明：正确的英文拼写和语法可以让阅读者易于理解，避免歧义。注意，纯拼音命名方式更要避免采用。

正例：ali / alibaba  / beijing / hangzhou 等国际通用的名称，可视同英文。

反例：DaZhePromotion [打折] / getPingfenByName() [评分] / String je[金额] / int 某变量 = 3

【强制】代码和注释中都要避免使用任何语言的种族歧视性词语。

正例：日本人 / 印度人 / blockList / allowList / secondary 

反例：RIBENGUIZI/ Asan / blackList / whiteList / slave

【强制】类名使用 UpperCamelCase 风格，但以下情形例外：DO / BO / DTO / VO / AO / PO / UID 等。

正例：ForceCode / UserDO / HtmlDTO / XmlService / TcpUdpDeal / TaPromotion

反例：forcecode / UserDo / HTMLDto / XMLService / TCPUDPDeal / TAPromotion

【强制】方法名、参数名、成员变量、局部变量都统一使用lowerCamelCase风格，必须遵从驼峰形式。

正例：localValue / getHttpMessage() / inputUserId

【强制】常量命名全部大写，单词间用下划线隔开，力求语义表达完整清楚，不要嫌名字长。

正例：MAX_STOCK_COUNT/CACHE_EXPIRED_TIME

反例：MAX_COUNT/EXPIRED_TIME

【强制】抽象类命名使用 Abstract 或 Base 开头；异常类命名使用 Exception 结尾；测试类 命名以它要测试的类的名称开始，以 Test 结尾。

【强制】类型与中括号紧挨相连来表示数组。·

正例：定义整形数组 int[] arrayDemo。

反例：在 main 参数中，使用 String args[]来定义。

【强制】POJO 类中的任何布尔类型的变量，都不要加 is 前缀，否则部分框架解析会引起序列 化错误。

说明：在 MySQL 规约中的建表约定第一条，表达是与否的变量采用 is_xxx 的命名方式，所以，需要 在<resultMap>设置从 is_xxx 到 xxx 的映射关系。

反例：定义为基本数据类型Boolean isDeleted 的属性，它的方法也是isDeleted()，框架在反向解析的时候，“误以为”对应的属性名称是 deleted，导致属性获取不到，进而抛出异常。

【强制】包名统一使用小写，点分隔符之间有且仅有一个自然语义的英语单词。包名统一使用单数形式，但是类名如果有复数含义，类名可以使用复数形式。

正例：应用工具类包名为com.company.ei.kunlun.aap.util、类名为MessageUtils（此规则参考 spring 的框架结构）。

【强制】避免在子父类的成员变量之间、或者不同代码使可理解性降低。

说明：子类、父类成员变量名相同，即使是 public 类型的变量也能够通过编译，另外，局部变量在同一方法内的不同代码块中同名也是合法的，这些情况都要避免。对于非 setter/getter 的参数名称也要避免与成员变量名称相同。

反例：

public class ConfusingName {

    public int stock;

    // 非 setter/getter 的参数名称，不允许与本类成员变量同名

    public void get(String hello) {

        if(condition) {

            final int m


 

 
oney = 531;

            // ...

        }

        for (int i = 0; i < 10; i++) {

            // 在同一方法体中，不允许与其它代码块中的 money 命名相同

            final int money = 615;

            // ...

        }

    }

}

class Son extends ConfusingName {

        // 不允许与父类的成员变量名称相同

        public int stock;

}

【强制】杜绝完全不明所以的缩写，避免望文不知义。

反例：AbstractClass“缩写”成 AbsClass；condition“缩写”成 condi；Function 缩写”成 Fu，此类 随意缩写严重降低了代码的可阅读性。

【推荐】为了达到代码自解释的目标，任何定义编程元素在命名时使用尽量完整单词组合来表达其意。

正例：对某个对象引用的 volatile 字段进行原子更新的类名为 AtomicReferenceFieldUpdater。

反例：常见的方法内变量为 int a;的定义方式。

【推荐】在常量与变量的命名时，表示类型的名词放在词尾，以提升辨识度。

正例：startTime / workQueue / nameList / TERMINATED_THREAD_COUNT

反例：startedAt / QueueOfWork / listName / COUNT_TERMINATED_THREAD

【推荐】如果模块、接口、类、方法使用了设计模式，在命名时体现出具体模式。

说明：将设计模式体现在名字中，有利于阅读者快速理解架构设计理念。

正例：public class OrderFactory; 

public class LoginProxy; 

public class ResourceObserver;

【推荐】接口类中的方法和属性不要加任何修饰符号（public 也不要加），保持代码的简洁 性，并加上有效的 Javadoc 注释。尽量不要在接口里定义变量，如果一定要定义变量，确定 与接口方法相关，并且是整个应用的基础常量。

正例：接口方法签名：void commit();

接口基础常量表示：String COMPANY = "taobao";

反例：接口方法定义：public abstract void f();

说明：JDK8 中接口允许有默认实现，那么这个 default 方法，是对所有实现类都有价值的默认实现。

接口和实现类的命名有两套规则：

1）【强制】对于 Service 和 DAO 类，基于 SOA 的理念，暴露出来的服务一定是接口，内部的实现类用 Impl 的后缀与接口区别。

正例：CacheServiceImpl实现CacheService接口。

2）【推荐】如果是形容能力的接口名称，取对应的形容词为接口名（通常是–able 的形容词）。 

正例：AbstractTranslator 实现 Translatable 接口。

【参考】枚举类名建议带上Enum后缀，枚举成员名称需要全大写，单词间用下划线隔开。

说明：枚举其实就是特殊的常量类，且构造方法被默认强制是私有。

正例：枚举名字为 ProcessStatusEnum 的成员名称：SUCCESS / UNKNOWN_REASON。

【参考】各层命名规约：

A) Service/DAO 层方法命名规约 

1） 获取单个对象的方法用 get 做前缀。 

2） 获取多个对象的方法用 list 做前缀，复数结尾，如：listObjects。 

3） 获取统计值的方法用 count 做前缀。 

4） 插入的方法用 save/insert 做前缀。 

5） 删除的方法用 remove/delete 做前缀。 

6） 修改的方法用 update 做前缀。

B) 领域模型命名规约

1） 数据对象：xxxDO，xxx 即为数据表名。 

2） 数据传输对象：xxxDTO，xxx 为业务领域相关的名称。 

3） 展示对象：xxxVO，xxx 一般为网页名称。 

4） POJO 是 DO/DTO/BO/VO 的统称，禁止命名成 xxxPOJO。

(二) 常量定义
【强制】不允许任何魔法值（即未经预先定义的常量）直接出现在代码中。

　　反例：

// 本例中，开发者 A 定义了缓存的 key，然后开发者 B 使用缓存时少了下划线，即 key 是"Id#taobao"+tradeId，导致 出现故障 

String key = "Id#taobao_" + tradeId; 

cache.put(key, value);

【强制】在 long 或者 Long 赋值时，数值后使用大写字母 L，不能是小写字母 l，小写容易跟 数字混淆，造成误解。

　　说明：Long a = 2l; 写的是数字的 21，还是 Long 型的 2？

【推荐】不要使用一个常量类维护所有常量，要按常量功能进行归类，分开维护。

　　说明：大而全的常量类，非得使用查找功能才能定位到修改的常量，不利于理解和维护。

　　正例：缓存相关常量放在类 CacheConsts 下；系统配置相关常量放在类 SystemConfigConsts 下。

【推荐】常量的复用层次有五层：跨应用共享常量、应用内共享常量、子工程内共享常量、包内共享常量、类内共享常量。

　　1）跨应用共享常量：放置在二方库中，通常是client.jar中的constant目录下。

　　2）应用内共享常量：放置在一方库中，通常是modules中的constant目录下。

　反例：易懂变量也要统一定义成应用内共享常量，两位攻城师在两个类中分别定义了表示“是”的变量：

类A中：public static final String YES = "yes";

类B中：public static final String YES = "y"; 

A.YES.equals(B.YES)，预期是true，但实际返回为false，导致线上问题。

　　3） 子工程内部共享常量：即在当前子工程的constant目录下。

　　4） 包内共享常量：即在当前包下单独的constant目录下。

　　5） 类内共享常量：直接在类内部private static final定义。

【推荐】如果变量值仅在一个固定 内变化用 enum 类型来定义。

说明：如果存在名称之外的延伸属性应使用 enum 类型，下面正例中的数字就是延伸信息，表示一年中的 第几个季节。

　　正例：

public enum SeasonEnum {

     SPRING(1), SUMMER(2), AUTUMN(3), WINTER(4);

     private int seq;

     SeasonEnum(int seq){

         this.seq = seq;

     }

}

(三) 代码格式
【强制】大括号的使用约定。如果是大括号内为空，则简洁地写成{}即可，不需要换行；

　　如果是非空代码块则：

　　1） 左大括号前不换行。

　　2） 左大括号后换行。

　　3） 右大括号前换行。

　　4） 右大括号后还有 else 等代码则不换行；表示终止的右大括号后必须换行。

【强制】 左小括号和右边相邻字符之间不出现空格；右小括号和左边相邻字符之间也不出现空 格；而左大括号前需要加空格。详见第 5 条下方正例提示。

反例：if (空格a == b空格)

【强制】if/for/while/switch/do 等保留字与括号之间都必须加空格。

【强制】任何二目、三目运算符的左右两边都需要加一个空格。 

说明：包括赋值运算符=、逻辑运算符&&、加减乘除符号等。

【强制】采用4个空格缩进，禁止使用tab字符。

说明： 如果使用 Tab 缩进，必须设置 1 个 Tab 为 4 个空格。IDEA 设置 Tab 为 4 个空格时，请勿勾选 Use tab character；而在 Eclipse 中，必须勾选 insert spaces for tabs。

正例： （涉及1-5点）

public static void main(String[] args) {

    // 缩进4个空格

    String say = "hello";

    // 运算符的左右必须有一个空格

    int flag = 0;

    // 关键词if与括号之间必须有一个空格，括号内的f与左括号，0与右括号不需要空格

    if (flag == 0) {

        System.out.println(say);

    }

    // 左大括号前加空格且不换行；左大括号后换行

    if (flag == 1) {

        System.out.println("world");

        // 右大括号前换行，右大括号后有else，不用换行

    } else {

        System.out.println("ok");

        // 在右大括号后直接结束，则必须换行

    }

}

 

【强制】注释的双斜线与注释内容之间有且仅有一个空格。

正例：

// 这是示例注释，请注意在双斜线之后有一个空格

String commentString = new String();

【强制】在进行类型强制转换时，右括号与强制转换值之间不需要任何空格隔开。

正例：

double first = 3.2d;

int second = (int)first + 2;

【强制】单行字符数限制不超过 120 个，超出需要换行，换行时遵循如下原则：

　　1） 第二行相对第一行缩进 4 个空格，从第三行开始，不再继续缩进，参考示例。

　　2） 运算符与下文一起换行。

　　3） 方法调用的点符号与下文一起换行。

　　4） 方法调用时，多个参数，需要换行时，在逗号后进行。

　　5） 在括号前不要换行，见反例。 

正例：


 
StringBuffer sb = new StringBuffer();         

// 超过 120 个字符的情况下，换行缩进 4 个空格，并且方法前的点号一起换行

sb.append("zi").append("xin")...        

    .append("huang")...         

    .append("huang")...         

    .append("huang");


 
反例：

StringBuffer sb = new StringBuffer();

// 超过 120 个字符的情况下，不要在括号前换行

sb.append("zi").append("xin")...append

    ("huang");

// 参数很多的方法调用可能超过 120 个字符，逗号后才是换行处

method(args1, args2, args3, ...

    ,argsX);

 

【强制】方法参数在定义和传入时，多个参数逗号后面必须加空格。

正例：下例中实参的 args1，后边必须要有一个空格。

method(args1, args2, args3);

【强制】IDE的text file encoding设置为UTF-8; IDE中文件的换行符使用Unix格式，不要使用Windows格式。

【推荐】单个方法的总行数不超过 80 行。

说明：除注释之外的方法签名、左右大括号、方法内代码、空行、回车及任何不可见字符的总行数不超过80 行。

正例：代码逻辑分清红花和绿叶，个性和共性，绿叶逻辑单独出来成为额外方法，使主干代码更加清晰；共性逻辑抽取成为共性方法，便于复用和维护。

【推荐】没有必要增加若干空格来使变量的赋值等号与上一行对应位置的等号对齐。

正例：

int one = 3;

long two = 4L;

float three = 5F;

StringBuffer stringBuffer = new StringBuffer();

    说明：增加stringBuffer这个变量，如果需要对齐，则给one、two、three都要增加几个空格，在变量比较多的情况下，是一种累赘的事情。

【推荐】不同逻辑、不同语义、不同业务的代码之间插入一个空行分隔开来以提升可读性。说明：任何情形，没有必要插入多个空行进行隔开。

(四) OOP规约
【强制】避免通过一个类的对象引用访问此类的静态变量或静态方法，无谓增加编译器解析成 本，直接用类名来访问即可。

【强制】所有的覆写方法，必须加@Override注解。 

说明：getObject()与get0bject()的问题。一个是字母的O，一个是数字的0，加@Override可以准确判断是否覆盖成功。另外，如果在抽象类中对方法签名进行修改，其实现类会马上编译报错。

【强制】相同参数类型，相同业务含义，才可以使用Java的可变参数，避免使用Object。

说明：可变参数必须放置在参数列表的最后。（提倡同学们尽量不用可变参数编程）

正例：public User getUsers(String type, Integer... ids) {...}

【强制】外部正在调用或者二方库依赖的接口，不允许修改方法签名，避免对接口调用方产生 影响。接口过时必须加@Deprecated 注解，并清晰地说明采用的新接口或者新服务是什么。

【强制】不能使用过时的类或方法。 

说明：java.net.URLDecoder 中的方法decode(String encodeStr) 这个方法已经过时，应该使用双参数decode(String source, String encode)。接口提供方既然明确是过时接口，那么有义务同时提供新的接口；作为调用方来说，有义务去考证过时方法的新实现是什么。

【强制】Object的equals方法容易抛空指针异常，应使用常量或确定有值的对象来调用equals。

正例："test".equals(object);

反例：object.equals("test");

说明：推荐使用 JDK7 引入的工具类 java.util.Objects#equals(Object a, Object b)

【强制】所有整型包装类对象之间值的比较，全部使用 equals 方法比较。

说明：对于 Integer var = ? 在-128 至 127 之间的赋值，Integer 对象是在 IntegerCache.cache 产生， 会复用已有对象，这个区间内的 Integer 值可以直接使用==进行判断，但是这个区间之外的所有数据，都 会在堆上产生，并不会复用已有对象，这是一个大坑，推荐使用 equals 方法进行判断。

【强制】任何货币金额，均以最小货币单位且整型类型来进行存储。

【强制】浮点数之间的等值判断，基本数据类型不能用==来比较，包装数据类型不能用 equals 来判断。

说明：浮点数采用“尾数+阶码”的编码方式，类似于科学计数法的“有效数字+指数”的表示方式。二进 制无法精确表示大部分的十进制小数

反例：

float a = 1.0f - 0.9f;float b = 0.9f - 0.8f; 

if (a == b) { 

// 预期进入此代码快，执行其它业务逻辑 

// 但事实上 a==b 的结果为 false

}


 
Float x = Float.valueOf(a); 

Float y = Float.valueOf(b); 

if (x.equals(y)) { 

// 预期进入此代码快，执行其它业务逻辑

// 但事实上 equals 的结果为 false 


 
} 

正例：

 (1) 指定一个误差范围，两个浮点数的差值在此范围之内，则认为是相等的。


 
float a = 1.0f - 0.9f;

float b = 0.9f - 0.8f;

float diff = 1e-6f; 

if (Math.abs(a - b) < diff) {

    System.out.println("true"); 

} 


 
(2) 使用 BigDecimal 来定义值，再进行浮点数的运算操作。


 
BigDecimal a = new BigDecimal("1.0"); 

BigDecimal b = new BigDecimal("0.9");

BigDecimal c = new BigDecimal("0.8"); 


 
BigDecimal x = a.subtract(b);

BigDecimal y = b.subtract(c); 


 
if (x.compareTo(y) == 0) {

 System.out.println("true");

}

【强制】如上所示 BigDecimal 的等值比较应使用 compareTo()方法，而不是 equals()方法。

说明：equals()方法会比较值和精度（1.0 与 1.00 返回结果为 false），而 compareTo()则会忽略精度。

【强制】定义数据对象 DO 类时，属性类型要与数据库字段类型相匹配。

正例：数据库字段的 bigint 必须与类属性的 Long 类型相对应。 

反例：某个案例的数据库表 id 字段定义类型 bigint unsigned，实际类对象属性为 Integer，随着 id 越来 越大，超过 Integer 的表示范围而溢出成为负数。

【强制】禁止使用构造方法 BigDecimal(double)的方式把 double 值转化为 BigDecimal 对象。

说明：BigDecimal(double)存在精度损失风险，在精确计算或值比较的场景中可能会导致业务逻辑异常。 如：BigDecimal g = new BigDecimal(0.1F); 实际的存储值为：0.10000000149 

正例：优先推荐入参为 String 的构造方法，或使用 BigDecimal 的 valueOf 方法，此方法内部其实执行了 Double 的 toString，而 Double 的 toString 按 double 的实际能表达的精度对尾数进行了截断。

BigDecimal recommend1 = new BigDecimal("0.1");

BigDecimal recommend2 = BigDecimal.valueOf(0.1);

关于基本数据类型与包装数据类型的使用标准如下：

　　1）【强制】所有的POJO类属性必须使用包装数据类型。

　　2）【强制】RPC方法的返回值和参数必须使用包装数据类型。

　　3）【推荐】所有的局部变量使用基本数据类型。 

说明：POJO类属性没有初值是提醒使用者在需要使用时，必须自己显式地进行赋值，任何NPE问题，或者入库检查，都由使用者来保证。

　　正例：数据库的查询结果可能是 null，因为自动拆箱，用基本数据类型接收有 NPE 风险。

　　反例：某业务的交易报表上显示成交总额涨跌情况，即正负 x%，x 为基本数据类型，调用的 RPC 服务，调 用不成功时，返回的是默认值，页面显示为 0%，这是不合理的，应该显示成中划线-。所以包装数据类型 的 null 值，能够表示额外的信息，如：远程调用失败，异常退出。

【强制】定义DO/DTO/VO等POJO类时，不要设定任何属性默认值。

　　反例：POJO 类的 createTime 默认值为 new Date()，但是这个属性在数据提取时并没有置入具体值，在 更新其它字段时又附带更新了此字段，导致创建时间被修改成当前时间。

【强制】序列化类新增属性时，请不要修改serialVersionUID字段，避免反序列失败；

　　如果完全不兼容升级，避免反序列化混乱，那么请修改serialVersionUID值。

　　说明：注意serialVersionUID不一致会抛出序列化运行时异常。

【强制】构造方法里面禁止加入任何业务逻辑，如果有初始化逻辑，请放在init方法中。

【强制】POJO类必须写toString方法。使用IDE的中工具：source> generate toString时，

　　如果继承了另一个POJO类，注意在前面加一下super.toString。 

说明：在方法执行抛出异常时，可以直接调用POJO的toString()方法打印其属性值，便于排查问题。

【强制】禁止在 POJO类中，同时存在对应属性 xxx的 isXxx()和 getXxx()方法。

        说明： 框架在调用属性 xxx 的提取方法时，并不能确定哪个方法一定是被优先调用到。

【推荐】使用索引访问用String的split方法得到的数组时，需做最后一个分隔符后有无内容的检查，

　　否则会有抛IndexOutOfBoundsException的风险。

　　说明：

 String str = "a,b,c,,";

 String[] ary = str.split(","); 

// 预期大于3，结果是34 

System.out.println(ary.length);

 

【推荐】当一个类有多个构造方法，或者多个同名方法，这些方法应该按顺序放置在一起，便 于阅读，此条规则优先于下一条。

【推荐】 类内方法定义的顺序依次是：公有方法或保护方法 > 私有方法 > getter / setter 方法。

　　说明：公有方法是类的调用者和维护者最关心的方法，首屏展示最好；保护方法虽然只是子类关心，也可 能是“模板设计模式”下的核心方法；而私有方法外部一般不需要特别关心，是一个黑盒实现；因为承载 的信息价值较低，所有 Service 和 DAO 的 getter/setter 方法放在类体最后。

【推荐】setter方法中，参数名称与类成员变量名称一致，this.成员名 = 参数名。在getter/setter方法中，不要增加业务逻辑，增加排查问题的难度。

　　反例：

public Integer getData() {

    if (true) {

        return this.data + 100;

    } else {

        return this.data - 100;

    }

}

【推荐】循环体内，字符串的连接方式，使用StringBuilder的append方法进行扩展。

　　说明：反编译出的字节码文件显示每次循环都会new出一个StringBuilder对象，然后进行append操作，最后通过toString方法返回String对象，造成内存资源浪费。

　　反例：

 String str = "start";

 for (int i = 0; i < 100; i++) {

     str = str + "hello";

 }

 

【推荐】final可以声明类、成员变量、方法、以及本地变量，下列情况使用final关键字：

　　1） 不允许被继承的类，如：String类。

　　2） 不允许修改引用的域对象，如：POJO类的域变量。

　　3） 不允许被重写的方法，如：POJO类的setter方法。

　　4） 不允许运行过程中重新赋值的局部变量。

　　5） 避免上下文重复使用一个变量，使用final描述可以强制重新定义一个变量，方便更好地进行重构。

【推荐】慎用Object的clone方法来拷贝对象。 

  说明：对象 clone 方法默认是浅拷贝，若想实现深拷贝，需覆写 clone 方法实现域对象的深度遍历式拷贝。

【推荐】类成员与方法访问控制从严：

　　1） 如果不允许外部直接通过new来创建对象，那么构造方法必须是private。

　　2） 工具类不允许有public或default构造方法。

　　3） 类非static成员变量并且与子类共享，必须是protected。

　　4） 类非static成员变量并且仅在本类使用，必须是private。

　　5） 类static成员变量如果仅在本类使用，必须是private。

　　6） 若是static成员变量，必须考虑是否为final。

　　7） 类成员方法只供类内部调用，必须是private。

　　8） 类成员方法只对继承类公开，那么限制为protected。

　　说明：任何类、方法、参数、变量，严控访问范围。过于宽泛的访问范围，不利于模块解耦。思考：如果 是一个 private 的方法，想删除就删除，可是一个 public 的 service 成员方法或成员变量，删除一下，不 得手心冒点汗吗？变量像自己的小孩，尽量在自己的视线内，变量作用域太大，无限制的到处跑，那么你 会担心的。

(五) 集合处理
【强制】关于hashCode和equals的处理，遵循如下规则：

　　1） 只要重写equals，就必须重写hashCode。

　　2） 因为Set存储的是不重复的对象，依据hashCode和equals进行判断，所以Set存储的对象必须重写这两个方法。

　　3） 如果自定义对象做为Map的键，那么必须重写hashCode和equals。

　　说明：String重写了hashCode和equals方法，所以我们可以非常愉快地使用String对象作为key来使用。

【强制】 ArrayList的subList结果不可强转成ArrayList，否则会抛出ClassCastException异常，即java.util.RandomAccessSubList cannot be cast to java.util.ArrayList. 

说明：subList 返回的是 ArrayList 的内部类 SubList，并不是 ArrayList ，而是 ArrayList 的一个视图，对于SubList子列表的所有操作最终会反映到原列表上。

【强制】在 subList 场景中，高度注意对父集合元素的增加或删除，均会导致子列表的遍历、 增加、删除产生 ConcurrentModificationException 异常。

【强制】使用集合转数组的方法，必须使用集合的 toArray(T[] array)，传入的是类型完全一致、长度为 0 的空数组。

反例：直接使用 toArray 无参方法存在问题，此方法返回值只能是 Object[]类，若强转其它类型数组将出现ClassCastException 错误。

正例：

 List<String> list = new ArrayList<String>(2);

 list.add("guan");

 list.add("bao");

 String[] array = list.toArray(new String[0]);

     说明：使用 toArray 带参方法，数组空间大小的 length：

1） 等于 0，动态创建与 size 相同的数组，性能最好。

2） 大于 0 但小于 size，重新创建大小等于 size 的数组，增加 GC 负担。

3） 等于 size，在高并发情况下，数组创建完成之后，size 正在变大的情况下，负面影响与 2 相同。

4） 大于 size，空间浪费，且在 size 处插入 null 值，存在 NPE 隐患。

【强制】使用工具类Arrays.asList()把数组转换成集合时，不能使用其修改集合相关的方法，

　　它的add/remove/clear方法会抛出UnsupportedOperationException异常。

　　说明：asList 的返回对象是一个 Arrays 内部类，并没有实现集合的修改方法。Arrays.asList 体现的是适配器模式，只是转换接口，后台的数据仍是数组。

　　String[] str = new String[] { "you", "wu" }; 

  List list = Arrays.asList(str);

　　第一种情况：list.add("yangguanbao"); 运行时异常。 

第二种情况：str[0] = "change"; 也会随之修改，反之亦然。

【强制】泛型通配符<? extends T>来接收返回的数据，此写法的泛型集合不能使用add方法，而<? super T>不能使用get方法，做为接口调用赋值时易出错。

　　说明：扩展说一下 PECS(Producer Extends Consumer Super)原则：第一、频繁往外读取内容的，适合用 <? extends T>。第二、经常往里插入的，适合用<? super T>

【强制】不要在foreach循环里进行元素的remove/add操作。remove元素请使用Iterator方式，如果并发操作，需要对Iterator对象加锁。

正例：


 
List<String> list = new ArrayList<>(); 

list.add("1"); 

list.add("2"); 

Iterator<String> iterator = list.iterator(); 

while (iterator.hasNext()) {

    String item = iterator.next();

    if (删除元素的条件) {

        iterator.remove();

    } 

}


 
 反例：

for (String item : list) {

 if ("1".equals(item)) {

     list.remove(item); 

  } 

}

　　说明：以上代码的执行结果肯定会出乎大家的意料，那么试一下把“1”换成“2”，会是同样的结果吗？

【强制】 在JDK7版本及以上，Comparator要满足如下三个条件，不然Arrays.sort，Collections.sort会报IllegalArgumentException异常。

　　说明：三个条件如下

　　 1） x，y的比较结果和y，x的比较结果相反。

　　2） x>y，y>z，则x>z。

　　3） x=y，则x，z比较结果和y，z比较结果相同。

反例：下例中没有处理相等的情况，交换两个对象判断结果并不互反，不符合第一个条件，在实际使用中 可能会出现异常。

new Comparator<Student>() {

    @Override

    public int compare(Student o1, Student o2) { 

        return o1.getId() > o2.getId() ? 1 : -1; 

    }

};

【推荐】集合初始化时，指定集合初始值大小。 

说明：HashMap 使用 HashMap(int initialCapacity) 初始化，如果暂时无法确定集合大小，那么指定默 认值（16）即可。

正例：initialCapacity = (需要存储的元素个数 / 负载因子) + 1。注意负载因子（即 loader factor）默认 为 0.75，如果暂时无法确定初始值大小，请设置为 16（即默认值）。

反例： HashMap 需要放置 1024 个元素，由于没有设置容量初始大小，随着元素增加而被迫不断扩容， resize()方法总共会调用 8 次，反复重建哈希表和数据迁移。当放置的集合元素个数达千万级时会影响程序性能。

 【推荐】使用entrySet遍历Map类集合KV，而不是keySet方式进行遍历。 

说明：keySet 其实是遍历了 2 次，一次是转为 Iterator 对象，另一次是从 hashMap 中取出 key 所对应的 value。而 entrySet 只是遍历了一次就把 key 和 value 都放到了 entry 中，效率更高。如果是 JDK8，使用 Map.forEach 方法。 

正例：values()返回的是 V 值集合，是一个 list 集合对象；keySet()返回的是 K 值集合，是一个 Set 集合对 象；entrySet()返回的是 K-V 值组合集合。

【推荐】高度注意Map类集合K/V能不能存储null值的情况，如下表格：

 

　　反例： 由于HashMap的干扰，很多人认为ConcurrentHashMap是可以置入null值，而事实上，存储null值时会抛出NPE异常。

【参考】合理利用好集合的有序性(sort)和稳定性(order)，避免集合的无序性(unsort)和不稳定性(unorder)带来的负面影响。

　　说明：有序性是指遍历的结果是按某种比较规则依次排列的。稳定性指集合每次遍历的元素次序是一定的。如：ArrayList是order/unsort；HashMap是unorder/unsort；TreeSet是order/sort。

【参考】利用 Set 元素唯一的特性，可以快速对一个集合进行去重操作，避免使用 List 的 contains()进行遍历去重或者判断包含操作。

(六) 并发处理
【强制】获取单例对象需要保证线程安全，其中的方法也要保证线程安全。 

说明：资源驱动类、工具类、单例工厂类都需要注意。

【强制】创建线程或线程池时请指定有意义的线程名称，方便出错时回溯。 

正例：自定义线程工厂，并且根据外部特征进行分组，比如，来自同一机房的调用，把机房编号赋值给whatFeatureOfGroup。

public class UserThreadFactory implements ThreadFactory {

    private final String namePrefix;

    private final AtomicInteger nextId = new AtomicInteger(1);

    UserThreadFactory(String whatFeaturOfGroup) {

        namePrefix = "From UserThreadFactory's " + whatFeaturOfGroup + "-Worker-";

    }

    @Override

    public Thread newThread(Runnable task) {

        String name = namePrefix + nextId.getAndIncrement();

        Thread thread = new Thread(null, task, name, 0, false);

        System.out.println(thread.getName());

        return thread;

    }

}

【强制】线程资源必须通过线程池提供，不允许在应用中自行显式创建线程。

　　说明：使用线程池的好处是减少在创建和销毁线程上所花的时间以及系统资源的开销，解决资源不足的问题。如果不使用线程池，有可能造成系统创建大量同类线程而导致消耗完内存或者“过度切换”的问题。

【强制】线程池不允许使用 Executors去创建，而是通过 TThreadPoolExecutor的方式，这样 的处理方式让写同学更加明确线程池运行规则，避资源耗尽风险。

　　说明：Executors返回的线程池对象 返回的线程池对象的弊端如下 ：

　　　　1） FixedThreadPool和 SingleThreadPoolPool : 允许的请求队列长度为 Integer.MAX_VALUE，可 能会堆积大量的请求，从而导致 OOM。

　　　　2） CachedThreadPool 和ScheduledThreadPool : 允许的创建线程数量为 Integer.MAX_VALUE，可能会创建大量的线程，从而导致 OOM。

【强制】SimpleDateFormat 是线程不安全的类，一般不要定义为static变量，如果定义为static，必须加锁，或者使用DateUtils工具类。

　　正例：注意线程安全，使用DateUtils。亦推荐如下处理：

private static final ThreadLocal<DateFormat> df = new ThreadLocal<DateFormat>() { 

    @Override

    protected DateFormat initialValue() {

         return new SimpleDateFormat("yyyy-MM-dd"); 

    } 

};

　　说明：如果是 JDK8 的应用，可以使用 Instant 代替 Date，LocalDateTime 代替 Calendar， DateTimeFormatter 代替 SimpleDateFormat，官方给出的解释：simple beautiful strong immutable thread-safe。

【强制】高并发时，同步调用应该去考量锁的性能损耗。能用无锁数据结构，就不要用锁；

　　能锁区块，就不要锁整个方法体；能用对象锁，就不要用类锁。

　　说明：尽可能使加锁的代码块工作量尽可能的小，避免在锁代码块中调用RPC方法。

【强制】对多个资源、数据库表、对象同时加锁时，需要保持一致的加锁顺序，否则可能会造成死锁。

　　说明：线程一需要对表A、B、C依次全部加锁后才可以进行更新操作，那么线程二的加锁顺序也必须是A、B、C，否则可能出现死锁。

【强制】并发修改同一记录时，避免更新丢失，需要加锁。要么在应用层加锁，要么在缓存加锁，要么在数据库层使用乐观锁，使用version作为更新依据。 

说明：如果每次访问冲突概率小于20%，推荐使用乐观锁，否则使用悲观锁。乐观锁的重试次数不得小于3次。

【强制】多线程并行处理定时任务时，Timer运行多个TimeTask时，只要其

捕获抛出的异常，其它任务便会自动终止运行，使用ScheduledExecutorService则没有这个问题。

【推荐】使用 CountDownLatch 进行异步转同步操作，每个线程退出前必须调用 countDown 方法，线程执行代码注意 catch 异常，确保 countDown 方法被执行到，避免主线程无法执行至 await 方法，直到超时才返回结果。

　　说明：注意，子线程抛出异常堆栈，不能在主线程try-catch到。

【推荐】避免Random实例被多线程使用，虽然共享该实例是线程安全的，但会因竞争同一seed 导致的性能下降。

　　说明：Random实例包括java.util.Random 的实例或者 Math.random()的方式。

　　正例：在 JDK7 之后，可以直接使用 API ThreadLocalRandom，而在 JDK7 之前，需要编码保证每个线 程持有一个单独的 Random 实例。

【推荐】通过双重检查锁（double-checked locking）（在并发场景下）存在延迟初始化的优化

问题隐患（可参考 The "Double-Checked Locking is Broken" Declaration），推荐解决方案中较 为简单一种（适用于 JDK5 及以上版本），将目标属性声明为 volatile 型，比如将 helper 的属

性声明修改为private volatile Helper helper = null;。

正例：

public class LazyInitDemo { 

    private volatile Helper helper = null;

    public Helper getHelper() {

    if (helper == null) { 

            synchronized (this) { 

            if (helper == null) { 

                helper = new Helper(); 

              } 

            }

         } 

        return helper;

    } 

    // other methods and fields...

}

 

【参考】volatile 解决多线程内存不可见问题。对于一写多读，是可以解决变量同步问题，但 是如果多写，同样无法解决线程安全问题。

说明：如果是 count++操作，使用如下类实现：AtomicInteger count = new AtomicInteger(); count.addAndGet(1); 如果是 JDK8，推荐使用 LongAdder 对象，比 AtomicLong 性能更好（减少乐观 锁的重试次数）。

【参考】 HashMap在容量不够进行resize时由于高并发可能出现死链，导致CPU飙升，在开发过程中可以使用其它数据结构或加锁来规避此风险。

 【参考】ThreadLocal 对象使用 static 修饰，ThreadLocal 无法解决共享对象的更新问题。

说明：这个变量是针对一个线程内所有操作共享的，所以设置为静态变量，所有此类实例共享此静态变量， 也就是说在类第一次被使用时装载，只分配一块存储空间，所有此类的对象(只要是这个线程内定义的)都可 以操控这个变量。

(七) 控制语句
【强制】在一个switch块内，每个case要么通过break/return等来终止，要么注释说明程序将继续执行到哪一个case为止；在一个switch块内，都必须包含一个default语句并且放在最后，即使它什么代码也没有。

说明：注意 break 是退出 switch 语句块，而 return 是退出方法体。

【强制】在if/else/for/while/do语句中必须使用大括号。

说明：即使只有一行代码，也禁止不采用大括号的编码方式：if (condition) statements;

【推荐】表达异常的分支时，少用if-else方式，这种方式可以改写成：

if (condition) {

     ...

     return obj;

 }

 // 接着写else的业务逻辑代码;

 　   说明：如果非得使用if()...else if()...else...方式表达逻辑，避免后续代码维护困难，请勿超过3层。

　　正例：超过3层的 if-else 的逻辑判断代码可以使用卫语句、策略模式、状态模式等来实现，其中卫语句示例如下：

public class GuardSatementsDemo{

     public void findBoyfriend(Man man) {

         if(man.isBadTemper()) {

             System.out.println(“月球有多远，你就给我滚多远.”);

             return;

         }

         if (man.isShort()) {

             System.out.println(“我不需要武大郎一样的男友.”);

             return;

         }

         if (man.isPoor()) {

             System.out.println(“贫贱夫妻百事哀.”);

             return;

         }

         System.out.println(“可以先交往一段时间看看.”);

     }

 }

【强制】除常用方法（如getXxx/isXxx）等外，不要在条件判断中执行其它复杂的语句，将复杂逻辑判断的结果赋值给一个有意义的布尔变量名，以提高可读性。

　　说明：很多 if 语句内的逻辑表达式相当复杂，与、或、取反混合运算，甚至各种方法纵深调用，理解成本 非常高。如果赋值一个非常好理解的布尔变量名字，则是件令人爽心悦目的事情。

正例：

// 伪代码如下 

final boolean existed = (file.open(fileName, "w") != null) && (...) || (...); 

if (existed) { 

   ...

}

   反例：

public final void acquire ( long arg) {

    if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg)) {

         selfInterrupt();

     }

}

【推荐】循环体中的语句要考量性能，以下操作尽量移至循环体外处理，如定义对象、变量、获取数据库连接，进行不必要的try-catch操作（这个try-catch是否可以移至循环体外）。

【推荐】公开接口需要进行入参保护，尤其是批量操作的接口。

反例：某业务系统，提供一个用户批量查询的接口，API 文档上有说最多查多少个，但接口实现上没做任何保护，导致调用方传了一个 1000 的用户 id 数组过来后，查询信息后，内存爆了。

【参考】下列情形，需要进行参数校验：



　　1） 调用频次低的方法。

　　2） 执行时间开销很大的方法。此情形中，参数校验时间几乎可以忽略不计，但如果因为参数错误导致中间执行回退，或者错误，那得不偿失。

　　3） 需要极高稳定性和可用性的方法。

　　4） 对外提供的开放接口，不管是RPC/API/HTTP接口。

　　5） 敏感权限入口。

【参考】下列情形，不需要进行参数校验：

　　1） 极有可能被循环调用的方法。但在方法说明里必须注明外部参数检查要求。

　　2） 底层调用频度比较高的方法。毕竟是像纯净水过滤的最后一道，参数错误不太可能到底层才会暴露问题。一般DAO层与Service层都在同一个应用中，部署在同一台服务器中，所以DAO的参数校验，可以省略。

　　3） 被声明成private只会被自己代码所调用的方法，如果能够确定调用方法的代码传入参数已经做过检查或者肯定不会有问题，此时可以不校验参数。

(八) 注释规约
【强制】类、类属性、类方法的注释必须使用Javadoc规范，使用/**内容*/格式，不得使用// xxx方式。

说明：在IDE编辑窗口中，Javadoc方式会提示相关注释，生成Javadoc可以正确输出相应注释；

　　在IDE中，工程调用方法时，不进入方法即可悬浮提示方法、参数、返回值的意义，提高阅读效率。

【强制】所有的抽象方法（包括接口中的方法）必须要用Javadoc注释、除了返回值、参数、异常说明外，还必须指出该方法做什么事情，实现什么功能。 

说明：对子类的实现要求，或者调用注意事项，请一并说明。

【强制】所有的类都必须添加创建者和创建日期。

说明：在设置模板时，注意 IDEA 的@author 为${USER}，而 eclipse 的@author 为${user}，大小写有区别，而日期的设置统一为 yyyy/MM/dd 的格式。

正例：

/**

* @author jinbing

* @date 2020/10/31

*/

【强制】方法内部单行注释，在被注释语句上方另起一行，使用//注释。方法内部多行注释使用/* */注释，注意与代码对齐。

【强制】所有的枚举类型字段必须要有注释，说明每个数据项的用途。

【推荐】与其“半吊子”英文来注释，不如用中文注释把问题说清楚。专有名词与关键字保持英文原文即可。 

反例：“TCP连接超时”解释成“传输控制协议连接超时”，理解反而费脑筋。

【推荐】代码修改的同时，注释也要进行相应的修改，尤其是参数、返回值、异常、核心逻辑等的修改。

说明：代码与注释更新不同步，就像路网与导航软件更新不同步一样，如果导航软件严重滞后，就失去了导航的意义。

【参考】谨慎注释掉代码。在上方详细说明，而不是简单地注释掉。如果无用，则删除。

说明：代码被注释掉有两种可能性：

　　1）后续会恢复此段代码逻辑。

　　2）永久不用。前者如果没有备注信息，难以知晓注释动机。后者建议直接删掉（代码仓库保存了历史代码）。

【参考】对于注释的要求：

　　第一、能够准确反应设计思想和代码逻辑；

　　第二、能够描述业务含义，使别的程序员能够迅速了解到代码背后的信息。完全没有注释的大段代码对于阅读者形同天书，注释是给自己看的，即使隔很长时间，也能清晰理解当时的思路；注释也是给继任者看的，使其能够快速接替自己的工作。

【参考】好的命名、代码结构是自解释的，注释力求精简准确、表达到位。

　　避免出现注释的一个极端：过多过滥的注释，代码的逻辑一旦修改，修改注释是相当大的负担。 

反例：

　　// put elephant into fridge

　　put(elephant, fridge);

方法名put，加上两个有意义的变量名elephant和fridge，已经说明了这是在干什么，语义清晰的代码不需要额外的注释。

【参考】特殊注释标记，请注明标记人与标记时间。注意及时处理这些标记，通过标记扫描，经常清理此类标记。线上故障有时候就是来源于这些标记处的代码。

　　　　1） 待办事宜（TODO）:（ 标记人，标记时间，[预计处理时间]） 

表示需要实现，但目前还未实现的功能。这实际上是一个Javadoc的标签，目前的Javadoc还没有实现，但已经被广泛使用。只能应用于类，接口和方法（因为它是一个Javadoc标签）。

　　　　2） 错误，不能工作（FIXME）:（标记人，标记时间，[预计处理时间]） 在注释中用FIXME标记某代码是错误的，而且不能工作，需要及时纠正的情况。

(九) 其它
【强制】在使用正则表达式时，利用好其预编译功能，可以有效加快正则匹配速度。

说明：不要在方法体内定义：Pattern pattern = Pattern.compile(规则);

【强制】velocity调用POJO类的属性时，建议直接使用属性名取值即可，模板引擎会自动按规范调用POJO的getXxx()，如果是boolean基本数据类型变量（boolean命名不需要加is前缀），会自动调用isXxx()方法。

说明：注意如果是Boolean包装类对象，优先调用getXxx()的方法。

【强制】后台输送给页面的变量必须加$!{var}——中间的感叹号。 

说明：如果var=null或者不存在，那么${var}会直接显示在页面上。

【强制】注意 Math.random() 这个方法返回是double类型，注意取值的范围 0≤x<1（能够取到零值，注意除零异常），如果想获取整数类型的随机数，不要将x放大10的若干倍然后取整，直接使用Random对象的nextInt或者nextLong方法。

【强制】获取当前毫秒数System.currentTimeMillis(); 而不是new Date().getTime();

说明：如果想获取更加精确的纳秒级时间值，使用System.nanoTime()的方式。在JDK8中，针对统计时间等场景，推荐使用Instant类。

【推荐】不要在视图模板中加入任何复杂的逻辑。 说明：根据MVC理论，视图的职责是展示，不要抢模型和控制器的活。

【推荐】任何数据结构的构造或初始化，都应指定大小，避免数据结构无限增长吃光内存。

【推荐】及时清理不再使用的代码段或配置信息。

　　说明：对于垃圾代码或过时配置，坚决清理干净，避免程序过度臃肿，代码冗余。

　　正例：对于暂时被注释掉，后续可能恢复使用的代码片断，在注释代码上方，统一规定使用三个斜杠(///)来说明注释掉代码的理由。

 

二、异常日志
异常处理
【强制】Java 类库中定义的一类RuntimeException可以通过预先检查进行规避，而不应该通过catch 来处理，比如：IndexOutOfBoundsException，NullPointerException等等。

说明：无法通过预检查的异常除外，如在解析一个外部传来的字符串形式数字时，通过catch NumberFormatException来实现。

正例：if (obj != null) {...}

反例：try { obj.method() } catch (NullPointerException e) {...}

【强制】异常不要用来做流程控制，条件控制。

说明：异常设计的初衷是解决程序运行中的各种意外情况，且异常的处理效率比条件判断方式要低很多。

 【强制】catch 时请分清稳定代码和非稳定代码，稳定代码指的是无论如何不会出错的代码。对于非稳定代码的 catch 尽可能进行区分异常类型，再做对应的异常处理。

说明：对大段代码进行 try-catch，使程序无法根据不同的异常做出正确的应激反应，也不利于定位问题，这是一种不负责任的表现。

正例：用户注册的场景中，如果用户输入非法字符，或用户名称已存在，或用户输入密码过于简单，在程序上作出分门别类的判断，并提示给用户。

【强制】捕获异常是为了处理它，不要捕获了却什么都不处理而抛弃之，如果不想处理它，请将该异常抛给它的调用者。最外层的业务使用者，必须处理异常，将其转化为用户可以理解的内容。

【强制】事务场景中，抛出异常被 catch 后，如果需要回滚，一定要注意手动回滚事务。

【强制】finally块必须对资源对象、流对象进行关闭，有异常也要做try-catch。 

说明：如果JDK7及以上，可以使用try-with-resources方式。

【强制】不能在finally块中使用return.

说明：try 块中的 return 语句执行成功后，并不马上返回，而是继续执行 finally 块中的语句，如果此处存 在 return 语句，则在此直接返回，无情丢弃掉 try 块中的返回点。

反例：

private int x = 0;

public int checkReturn() {

     try {

         // x 等于 1，此处不返回

         return ++x;

     } finally {

        // 返回的结果是 2

         return ++x;

     }

}

【强制】捕获异常与抛异常，必须是完全匹配，或者捕获异常是抛异常的父类。

说明：如果预期对方抛的是绣球，实际接到的是铅球，就会产生意外情况。

【推荐】方法的返回值可以为null，不强制返回空集合，或者空对象等，必须添加注释充分说明什么情况下会返回null值。调用方需要进行null判断防止NPE问题。 

说明：本手册明确防止NPE是调用者的责任。即使被调用方法返回空集合或者空对象，对调用者来说，也并非高枕无忧，必须考虑到远程调用失败、序列化失败、运行时异常等场景返回null的情况。

【推荐】防止NPE，是程序员的基本修养，注意NPE产生的场景：

　　1） 返回类型为基本数据类型，return 包装数据类型的对象时，自动拆箱有可能产生 NPE。

反例：public int f() { return Integer 对象}， 如果为 null，自动解箱抛 NPE。 

2） 数据库的查询结果可能为 null。 

3） 集合里的元素即使 isNotEmpty，取出的数据元素也可能为 null。 

4） 远程调用返回对象时，一律要求进行空指针判断，防止 NPE。 

5） 对于 Session 中获取的数据，建议进行 NPE 检查，避免空指针。 

6） 级联调用 obj.getA().getB().getC()；一连串调用，易产生 NPE。

正例：使用 JDK8 的 Optional 类来防止 NPE 问题。

【推荐】定义时区分unchecked / checked 异常，避免直接抛出new RuntimeException()，

　　更不允许抛出Exception或者Throwable，应使用有业务含义的自定义异常。推荐业界已定义过的自定义异常，如：DAOException / ServiceException等。

【参考】对于公司外的 http/api 开放接口必须使用 errorCode；而应用内部推荐异常抛出； 跨应用间 RPC 调用优先考虑使用 Result 方式，封装 isSuccess()方法、errorCode、 errorMessage；而应用内部直接抛出异常即可。

说明：关于 RPC 方法返回方式使用 Result 方式的理由： 

1）使用抛异常返回方式，调用方如果没有捕获到就会产生运行时错误。 

2）如果不加栈信息，只是 new 自定义异常，加入自己的理解的 error message，对于调用端解决问题 的帮助不会太多。如果加了栈信息，在频繁调用出错的情况下，数据序列化和传输的性能损耗也是问题。

三、安全规约
【强制】隶属于用户个人的页面或者功能必须进行权限控制校验。

说明：防止没有做水平权限校验就可随意访问、修改、删除别人的数据，比如查看他人的私信内容、修改他人的订单。

【强制】用户敏感数据禁止直接展示，必须对展示数据进行脱敏。

说明：查看个人手机号码会显示成:158****9119，隐藏中间4位，防止隐私泄露。

【强制】用户输入的SQL参数严格使用参数绑定或者METADATA字段值限定，防止SQL注入，禁止字符串拼接SQL访问数据库。

【强制】用户请求传入的任何参数必须做有效性验证。 

说明：忽略参数校验可能导致：

page size过大导致内存溢出

恶意order by导致数据库慢查询

任意重定向

SQL注入

反序列化注入

正则输入源串拒绝服务ReDoS

　　Java JavaJava代码用 代码用 正则来验证客户端的输入，有些正则写法验证普通用户输入没有问题，但是如果攻击人员使用的是特殊构造的字符串来验证，有可能导致死循环的 结果。

【强制】禁止向HTML页面输出未经安全过滤或未正确转义的用户数据。

【强制】表单、AJAX提交必须执行CSRF安全过滤。 

说明：CSRF(Cross-site request forgery)跨站请求伪造是一类常见编程漏洞。对于存在CSRF漏洞的应用/网站，攻击者可以事先构造好URL，只要受害者用户一访问，后台便在用户不知情情况下对数据库中用户参数进行相应修改。

【强制】URL 外部重定向传入的目标地址必须执行白名单过滤。

【强制】在使用平台资源，譬如短信、邮件、电话、下单、支付，必须实现正确的防重放限制，

　　如数量限制、疲劳度控制、验证码校验，避免被滥刷、资损。

     说明：如注册时发送验证码到手机，如果没有限制次数和频率，那么可以利用此功能骚扰到其它用户，并造成短信平台资源浪费。

【推荐】发贴、评论、发送即时消息等用户生成内容的场景必须实现防刷、文本内容违禁词过滤等风控策略。

四、存储规约
ORM映射
【强制】在表查询中，一律不要使用 * 作为查询的字段列表，需要哪些字段必须明确写明。

　　说明：1）增加查询分析器解析成本。2）增减字段容易与 resultMap 配置不一致。3）无用字段增加网络消耗，尤其是 text 类型的字段。

【强制】POJO类的布尔属性不能加is，而数据库字段必须加is_，要求在resultMap中进行字段与属性之间的映射。

　　说明：参见定义 POJO 类以及数据库字段定义规定，在 sql.xml 增加映射，是必须的。

【强制】不要用 resultClass 当返回参数，即使所有类属性名与数据库字段一一对应，也需要 定义<resultMap>；反过来，每一个表也必然有一个<resultMap>与之对应。

说明：配置映射关系，使字段与 DO 类解耦，方便维护。

【强制】sql.xml配置参数使用：#{}，#param# 不要使用${} 此种方式容易出现SQL注入。

【强制】iBATIS自带的queryForList(String statementName,int start,int size)不推荐使用。

说明：其实现方式是在数据库取到statementName对应的SQL语句的所有记录，再通过subList取start,size的子集合。

正例：

 Map<String, Object> map = new HashMap<String, Object>();

 map.put("start", start);

 map.put("size", size);

 

【强制】不允许直接拿HashMap与Hashtable作为查询结果集的输出。 

反例：某同学为避免写一个<resultMap>xxx</resultMap>，直接使用 HashTable 来接收数据库返回结 果，结果出现日常是把 bigint 转成 Long 值，而线上由于数据库版本不一样，解析成 BigInteger，导致线 上问题。

【强制】更新数据表记录时，必须同时更新记录对应的 update_time 字段值为当前时间。

【推荐】不要写一个大而全的数据更新接口。传入为 POJO 类，不管是不是自己的目标更新字 段，都进行 update table set c1=value1,c2=value2,c3=value3; 这是不对的。执行 SQL 时， 不要更新无改动的字段，一是易出错；二是效率低；三是增加 binlog 存储。

【参考】@Transactional 事务不要滥用。事务会影响数据库的 QPS，另外使用事务的地方需 要考虑各方面的回滚方案，包括缓存回滚、搜索引擎回滚、消息补偿、统计修正等。

【参考】<isEqual>中的 compareValue 是与属性值对比的常量，一般是数字，表示相等时 带上此条件；<isNotEmpty>表示不为空且不为 null 时执行；<isNotNull>表示不为 null 值 时执行。

五、工程结构
(一) 应用分层
(二) 二方库依赖
【强制】定义GAV遵从以下规则：

　　1） GroupID格式：com.{公司/BU }.业务线.[子业务线]，最多4级。

　　　　说明：{公司/BU} 例如：alibaba/taobao/tmall/aliexpress等BU一级；子业务线可选。

　　　　正例：com.taobao.jstorm 或 com.alibaba.dubbo.register

　　2） ArtifactID格式：产品线名-模块名。语义不重复不遗漏，先到中央仓库去查证一下。

　　　　正例：dubbo-client / fastjson-api / jstorm-tool 

3） Version：详细规定参考下方。

【强制】二方库版本号命名方式：主版本号.次版本号.修订号

　　1） 主版本号：产品方向改变，或者大规模API不兼容，或者架构不兼容升级。

　　2） 次版本号：保持相对兼容性，增加主要功能特性，影响范围极小的API不兼容修改。

　　3） 修订号：保持完全兼容性，修复BUG、新增次要功能特性等。 

说明： 注意起始版本号必须为：1.0.0，而不是 0.0.1。

　　反例：仓库内某二方库版本号从 1.0.0.0 开始，一直默默“升级”成 1.0.0.64，完全失去版本的语义信息。

【强制】线上应用不要依赖 SNAPSHOT 版本（安全包除外）；正式发布的类库必须先去中央仓 库进行查证，使 RELEASE 版本号有延续性，且版本号不允许覆盖升级。

　　说明：不依赖 SNAPSHOT 版本是保证应用发布的幂等性。另外，也可以加快编译时的打包构建。

【强制】二方库的新增或升级，保持除功能点之外的其它jar包仲裁结果不变。如果有改变，必须明确评估和验证。

说明：在升级时，进行 dependency:resolve 前后信息比对，如果仲裁结果完全不一致，那么通过dependency:tree 命令，找出差异点，进行<exclude>排除 jar 包。

【强制】二方库里可以定义枚举类型，参数可以使用枚举类型，但是接口返回值不允许使用枚举类型或者包含枚举类型的POJO对象。

【强制】依赖于一个二方库群时，必须定义一个统一的版本变量，避免版本号不一致。

说明：依赖springframework-core,-context,-beans，它们都是同一个版本，可以定义一个变量来保存版本：${spring.version}，定义依赖的时候，引用该版本。

【强制】禁止在子项目的pom依赖中出现相同的GroupId，相同的ArtifactId，但是不同的Version。

说明：在本地调试时会使用各子项目指定的版本号，但是合并成一个 war，只能有一个版本号出现在最后的 lib 目录中。曾经出现过线下调试是正确的，发布到线上却出故障的先例。

【推荐】所有 pom 文件中的依赖声明放在<dependencies>语句块中，所有版本仲裁放在 <dependencyManagement>语句块中。

说明：<dependencyManagement>里只是声明版本，并不实现引入，因此子项目需要显式的声明依赖， version 和 scope 都读取自父 pom。而<dependencies>所有声明在主 pom 的<dependencies>里的依 赖都会自动引入，并默认被所有的子项目继承。

【推荐】二方库不要有配置项，最低限度不要再增加配置项。

【参考】为避免应用二方库的依赖冲突问题，二方库发布者应当遵循以下原则：

　　1）精简可控原则。移除一切不必要的 API 和依赖，只包含 Service API、必要的领域模型对象、Utils 类、 常量、枚举等。如果依赖其它二方库，尽量是 provided 引入，让二方库使用者去依赖具体版本号；无 log 具体实现，只依赖日志框架。 

2）稳定可追溯原则。每个版本的变化应该被记录，二方库由谁维护，源码在哪里，都需要能方便查到。除 非用户主动升级版本，否则公共二方库的行为不应该发生变化。

(三)服务器
【推荐】高并发服务器建议调小TCP协议的time_wait超时时间。 

说明：操作系统默认240秒后，才会关闭处于time_wait状态的连接，在高并发访问下，服务器端会因为处于time_wait的连接数太多，可能无法建立新的连接，所以需要在服务器上调小此等待值。

正例：在linux服务器上请通过变更/etc/sysctl.conf文件去修改该缺省值（秒）：net.ipv4.tcp_fin_timeout = 30

【推荐】调大服务器所支持的最大文件句柄数（File Descriptor，简写为fd）。

说明：主流操作系统的设计是将TCP/UDP连接采用与文件一样的方式去管理，即一个连接对应于一个fd。主流的linux服务器默认所支持最大fd数量为1024，当并发连接数很大时很容易因为fd不足而出现“open too many files”错误，导致新的连接无法建立。 建议将linux服务器所支持的最大句柄数调高数倍（与服务器的内存数量相关）。

【推荐】给JVM设置-XX:+HeapDumpOnOutOfMemoryError参数，让JVM碰到OOM场景时输出dump信息。

说明：OOM的发生是有概率的，甚至有规律地相隔数月才出现一例，出现时的现场信息对查错非常有价值。

【推荐】在线上生产环境，JVM的Xms和Xmx设置一样大小的内存容量，避免在GC 后调整堆大小带来的压力。

【参考】服务器内部重定向使用forward；外部重定向地址使用URL拼装工具类来生成，否则会带来URL维护不一致的问题和潜在的安全风险。

附录

名词解释

POJO（Plain Ordinary Java Object）: 在本规约中，POJO 专指只有 setter/getter/toString 的 简单类，包括 DO/DTO/BO/VO 等。

DO（Data Object）：阿里巴巴专指数据库表一一对应的 POJO 类。此对象与数据库表结构一 一对应，通过 DAO 层向上传输数据源对象。

DTO（Data Transfer Object）：数据传输对象，Service 或 Manager 向外传输的对象。

BO（Business Object）：业务对象，可以由 Service 层输出的封装业务逻辑的对象。

Query：数据查询对象，各层接收上层的查询请求。注意超过 2 个参数的查询封装，禁止使用 Map 类来传输。

VO（View Object）：显示层对象，通常是 Web 向模板渲染引擎层传输的对象。

AO（Application Object）: 阿里巴巴专指 Application Object，即在 Service 层上，极为贴近 业务的复用代码。

CAS（Compare And Swap）：解决多线程并行情况下使用锁造成性能损耗的一种机制，这是 硬件实现的原子操作。CAS 操作包含三个操作数：内存位置、预期原值和新值。如果内存位 置的值与预期原值相匹配，那么处理器会自动将该位置值更新为新值。否则，处理器不做任何操作。

GAV（GroupId、ArtifactId、Version）: Maven 坐标，是用来唯一标识 jar 包。

OOP（Object Oriented Programming）: 本文泛指类、对象的编程处理方式。

AQS（AbstractQueuedSynchronizer）: 利用先进先出队列实现的底层同步工具类，它是很多上 层同步实现类的基础，比如：ReentrantLock、CountDownLatch、Semaphore 等，它们通过继承 AQS 实现其模版方法，然后将 AQS 子类作为同步组件的内部类，通常命名为 Sync。

ORM（Object Relation Mapping）: 对象关系映射，对象领域模型与底层数据之间的转换，本文泛指 iBATIS, mybatis 等框架。

NPE（java.lang.NullPointerException）: 空指针异常。

OOM（Out Of Memory）: 源于 java.lang.OutOfMemoryError，当 JVM 没有足够的内存 来为对象分配空间并且垃圾回收器也无法回收空间时，系统出现的严重状况。

一方库: 本工程内部子项目模块依赖的库（jar 包）。

二方库: 公司内部发布到中央仓库，可供公司内部其它应用依赖的库（jar 包）。

三方库: 公司之外的开源库（jar 包