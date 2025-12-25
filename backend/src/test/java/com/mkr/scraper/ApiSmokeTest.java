package com.mkr.scraper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiSmokeTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void booksEndpointAvailable() throws Exception {
        mockMvc.perform(get("/api/scrapedBooks"))
                .andExpect(status().isOk());
    }

    @Test
    void quotesEndpointAvailable() throws Exception {
        mockMvc.perform(get("/api/scrapedQuotes"))
                .andExpect(status().isOk());
    }
}

