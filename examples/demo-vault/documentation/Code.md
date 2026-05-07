This note shows some examples of code-blocks...
### sql
```sql
Select * from Personen
where id = 1234
limit 5;
```

### markdown
```markdown
Some typical md-formatted text:
**bold** can be used as can _italics_ and others.
```

### C\#
```C#
using System; // import some package

namespace HelloWorldApp // namespace as a group of assets
{
    class Program 
    {
        static void Main(string[] args) // starting point
        {
            Console.WriteLine("Hello World!"); // first output
        }
    }
}
```

### LaTeX
```tex
With the following definitions 
$f(z(t)):=u+\im\,v$ and $dz:= (x'+\im\,y')\,dt$ 
and with $a$ und $b$ as given starting and
end-point of the path $\gamma$ 
the complex integral can be split into its
real- und imaginary-part, which themselves
are real-valued integrals 
$$
\int_\gamma f(z)\dz = \int_a^b f(z(t))\,z'(t)\,\dt = 
\int_a^b (u\,x'-v\,y')\,\dt + \im\int_a^b (u\,y'+v\,x')\,\dt
$$
```

### python
```python
i = 10

# Checking if i is greater than 15
if i > 15:
    print("10 is less than 15")
    
print("I am Not in if")
```

### java
```java
public class AddNumbers {
    public static void main(String[] args) {
        int num1 = 5;
        int num2 = 10;
        int sum = num1 + num2;
        System.out.println("Sum is: " + sum);
    }
}
```

### json
```json
{
  "name": "John Doe",
  "age": 30,
  "isEmployed": true,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipcode": "10001"
  },
  "hobbies": ["reading", "running"]
}
```

### html
```html
<!DOCTYPE html>
<html>
<body>

<pre> 
<code> 
p { color: red; } body { background-color: #eee; } 
</code> 
</pre>

</body>
</html>
```

### php
```php
<?php  
  
echo "Hello World!";  
  
?>
```
