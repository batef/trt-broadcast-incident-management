package com.trt.broadcastincidentmanagement.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Daha spesifik olduğu için Spring bunu genel RuntimeException
    // handler'ından önce eşleştirir. Ham SQL/FK hatasını (ör. SQLState 23503)
    // kullanıcıya asla göstermeyiz; temiz bir Türkçe mesaj döneriz.
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleDataIntegrityViolation(DataIntegrityViolationException ex) {

        return Map.of(
                "error",
                "Bu işlem, ilişkili kayıtlar bulunduğu için tamamlanamadı."
        );
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleRuntimeException(RuntimeException ex) {

        return Map.of(
                "error", ex.getMessage()
        );
    }
}
