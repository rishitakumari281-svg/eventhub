import java.io.Console;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHash {
    public static void main(String[] args) {
        Console console = System.console();
        if (console == null) {
            System.out.println("Run this directly in PowerShell.");
            return;
        }
        char[] password = console.readPassword("Enter new password: ");
        String hash = new BCryptPasswordEncoder().encode(new String(password));
        System.out.println("BCrypt hash: " + hash);
        java.util.Arrays.fill(password, ' ');
    }
}
